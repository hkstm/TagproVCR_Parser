import json

with open('data/W1_G2H1_TBC_TRR.ndjson') as json_file:
    data = json.load(json_file)
    print(data)
