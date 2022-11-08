from collections import Counter
import enum
import os
import re

macros_re = re.compile("\{\{ ?([\w-]+)(\([^\{\}\(\)]*\))? ?\}\}")

IGNORED_FOLDERNAMES = ['.git', 'external']

IMPLEMENTED_MACROS = [
    'cssref',
    'jssidebar',
    'jsref',
    'readonlyinline',
    'glossary',
    'jsxref',
    'non-standard_inline',
    'non-standard_header',
    'deprecated_inline',
    'optional_inline',
    'interwiki',
    'bug',
    'availableinworkers',
    'experimental_inline',
    'cssxref',
    'deprecated_header',
    'specifications',
    'compat',
    'livesampleurl',
    'htmlelement',
    'embedlivesample',
    'embedinteractiveexample',
    'csssyntax',
    'cssinfo',
    'xref_cssinitial',
    'xref_cssinherited',
    'xref_csscomputed',
    'domxref',
    'ariarole',
    'htmlattrdef',
    'htmlattrxref',
    'no_tag_omission',
    'svgelement',
    'js_property_attributes',
    'embedghlivesample',
]


def get_file_paths(directory):
    for dirpath, _, filenames in os.walk(directory):
        for f in filenames:
            yield os.path.abspath(os.path.join(dirpath, f))


files = []
i = 1
files = get_file_paths('external/original-content')

markdown_files = [file for file in files if file.endswith(".md")]
markdown_files.sort()
# print('markdown_files', markdown_files)

macros_counter = Counter()

for markdown_file_path in markdown_files:
    print("\n", markdown_file_path)
    with open(markdown_file_path, 'r') as file:
        data = file.read()
        macros_found = re.findall(macros_re, data)
        for macro_found in macros_found:
            print(macro_found)
        macros_counter.update(macro_found[0].lower()
                              for macro_found in macros_found)

for i, [macro, weight] in enumerate(macros_counter.most_common(10000)):
    if macro not in IMPLEMENTED_MACROS:
        print(f"{i + 1}. {macro} – {weight}")

# print(macros_counter.most_common(100))
