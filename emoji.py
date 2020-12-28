#!/usr/bin/python3
# 
# parse Unicode's emoji data into db (just a json file for the moment)
#

import argparse
import collections
import datetime
import json
import os
import re
import shutil
import sys
import tempfile
import time
import urllib.parse
import urllib.request

default_output = os.path.abspath("./output")

datafiles = {
        "test": "emoji-test.txt",
        "data": "emoji-data.txt"
    }

parser = argparse.ArgumentParser()
parser.add_argument("-q", "--quiet", help="hide status messages", default=True, dest='verbose', action="store_false")
parser.add_argument("--output", help="output directory (default=%s)" % default_output, action="store", default=default_output)

args = parser.parse_args()

if args.verbose:
    print("INFO: emoji.py starting at %s" % datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S'))

def to_hex(i):
    if i > 0xFFFF:
        return "%x" % i
    else:
        return "%04x" % i

def to_handle(s):
    return re.sub(r'[^a-z]+', '_', s.strip().lower()).strip('_')

emojis = collections.OrderedDict()


#
# emoji-test.txt
#
line_pattern = re.compile("([A-F0-9 ]+);([-a-z ]+)# ([^ ]+) E([^ ]+) (.*)$")
filename = datafiles["test"]
sys.stdout.write("INFO: processing file '%s'" % filename)
f = open(os.path.join(args.output, filename), mode='r', encoding='utf-8')
line_count = 0
emoji_count = 0
for rawline in f:
    line_count += 1
    if line_count % 100 == 0:
        sys.stdout.write(".")
        
    line = rawline.strip()
        
    if len(line) == 0 or line[0] == '#':
        continue
        
    emoji_count += 1
    
    matcher = line_pattern.search(line)
    if not matcher:
        sys.stdout.write("\nERROR: no match on line %d ('%s')" % (line_count, line))
        continue

    codepoint = matcher.group(1).replace(' FE0F', '').strip().lower().replace(' ', '_')
    
    if codepoint in emojis:
        emoji = emojis[codepoint] 
    else:
        emoji = {}
        emoji['codepoints'] = matcher.group(1).replace(' FE0F', '').strip().lower()
        #emoji['status'] = matcher.group(2).strip()
        #emoji['chars'] = matcher.group(3)
        emoji['version'] = matcher.group(4)
        emoji['names'] = [ matcher.group(5) ]
        emoji['handles'] = [ to_handle(matcher.group(5)) ]

        emojis[codepoint] = emoji
    
    if " FEOF" in matcher.group(1):
        emoji['fully-qualified'] = matcher.group(1).strip().lower().replace(' ', '_')
    
f.close()
    
sys.stdout.write("\n")
sys.stdout.write("INFO: complete %d lines processed\n" % line_count)
sys.stdout.write("INFO: complete %d emoji processed\n" % emoji_count)
sys.stdout.write("INFO: total emoji: %d\n" % len(emojis))


#
# emoji-data.txt - standalone (single-codepoint) emoji
#
line_pattern = re.compile("([.A-F0-9 ]+);([-A-Za-z_ ]+)# +([^ ]+) (.*)$")
filename = datafiles["data"]
sys.stdout.write("INFO: processing file '%s'" % filename)
f = open(os.path.join(args.output, filename), mode='r', encoding='utf-8')
line_count = 0
emoji_count = 0
new_count = 0
for rawline in f:
    line_count += 1
    if line_count % 100 == 0:
        sys.stdout.write(".")
        
    line = rawline.strip()
        
    if len(line) == 0 or line[0] == '#':
        continue      
    
    matcher = line_pattern.search(line)
    if not matcher:
        sys.stdout.write("\nERROR: no match on line %d ('%s')" % (line_count, line))
        continue

    #if '<reserved-' in matcher.group(4):
    #    continue  

    if matcher.group(3).startswith("E0.0"):
        continue      
    
    str = matcher.group(1).strip()
    if ".." not in str:
        codepoints = [ str.lower() ]
    else:
        codepoints = []
        split = str.split("..")
        for loop in range(int(split[0], 16), int(split[1], 16)+1):
            codepoints.append(to_hex(loop))
        
    for codepoint in codepoints:
        emoji_count += 1
        if codepoint in emojis:
            emoji = emojis[codepoint] 
        else:
            #if args.verbose:
            #    sys.stdout.write("\nDEBUG: new emoji codepoint '%s'\n" % codepoint)
            new_count += 1
            emoji = {}
            emoji['codepoints'] = codepoint
            emoji['chars'] = chr(int(codepoint, 16))
            emoji['status'] = "component-only"
            emojis[codepoint] = emoji

        if 'property' not in emoji:
            emoji['property'] = {}
            
        emoji['property'][matcher.group(2).strip()] = True
        emoji['version'] = matcher.group(3).strip()
    
f.close()

sys.stdout.write("\n")
sys.stdout.write("INFO: complete %d lines processed\n" % line_count)
sys.stdout.write("INFO: complete %d emoji processed\n" % emoji_count)
sys.stdout.write("INFO: complete %d emoji added\n" % new_count)
sys.stdout.write("INFO: total emoji: %d\n" % len(emojis))

#
# hack for missing 20e3
#
#emojis['20e3'] = { "codepoints": "20e3", 'chars': chr(0x20e3), 'status': 'component-only', 'text': 'combining enclosing keycap' }

#
# link non-fully-qualified to their parents
#
if False:
    count = 0
    for key in emojis.keys():
        if emojis[key]["status"] == "fully-qualified" and "_fe0f" in key:
            unqualified = key.replace("_fe0f", "", 1)
            if unqualified in emojis:
                count = count + 1
                #sys.stdout.write("DEBUG: %s -> %s (1)\n" % (unqualified, key))
                emojis[unqualified]['fully-qualified'] = key
            else:
                sys.stdout.write("WARNING: no unqualified found for %s" % unqualified)

            # multiple instance of FE0F, so need to map with missing only 2nd instance, or missing both instances
            if "_fe0f" in unqualified:
                unqualified = key.replace("_fe0f", "")
                if unqualified in emojis:
                    count = count + 1
                    sys.stdout.write("DEBUG: %s -> %s (both)\n" % (unqualified, key))
                    emojis[unqualified]['fully-qualified'] = key
                else:
                    sys.stdout.write("WARNING: no unqualified found for %s" % unqualifed)

                unqualified = key[0:-5]     # HACK, but it is always at the end
                if unqualified in emojis:
                    count = count + 1
                    sys.stdout.write("DEBUG: %s -> %s (2)\n" % (unqualified, key))
                    emojis[unqualified]['fully-qualified'] = key
                else:
                    sys.stdout.write("WARNING: no unqualified found for %s" % unqualifed)

    #sys.stdout.write("\n")
    sys.stdout.write("INFO: %d not-fully-qualified emojis mapped\n" % count)

if False:
    count = 0
    for key in emojis.keys():
        if emojis[key]["status"] == "non-fully-qualified":
            if "fully-qualified" not in emojis[key]:
                count = count + 1
                sys.stdout.write("ERROR: no fully qualified version of %s\n" % key)

    if count > 0:
        sys.stdout.write("ERROR: %d non-fully-qualified emoji remain unmapped\n" % count)
        sys.exit(5)
    else:
        sys.stdout.write("INFO: all non-fully-qualified emoji are mapped\n")

filename = "emoji.json"
sys.stdout.write("INFO: saving to file '%s'\n" % filename)
f = open(os.path.join(args.output, filename), mode='w', encoding='utf-8')
f.write(json.dumps(emojis, ensure_ascii=False, sort_keys=False, indent=2, separators=(',', ': ')))
f.close()
sys.stdout.write("INFO: save complete: %d emoji\n" % len(emojis))

if False:
    normalize = {}
    for key in emojis.keys():
        if emojis[key]["status"] == "non-fully-qualified":
            normalize[key] = emojis[key]['fully-qualified']
        elif emojis[key]["status"] == "component-only":
            normalize[key] = key
        else:
            normalize[key] = key

    filename = "normalize.json"
    sys.stdout.write("INFO: saving to file '%s'\n" % filename)
    f = open(os.path.join(args.output, filename), mode='w', encoding='utf-8')
    f.write(json.dumps(normalize, ensure_ascii=False, sort_keys=True, indent=4, separators=(',', ': ')))
    f.close()
    sys.stdout.write("INFO: save complete: %d emoji\n" % len(emojis))

if args.verbose:
    print("INFO: unicode emoji data update complete at %s" % datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S'))



