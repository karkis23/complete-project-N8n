import urllib.request
import json
req = urllib.request.Request("http://127.0.0.1:8000/api/predict", data=b'{"spotLTP":23000,"vix":15,"angelOneCandles":[],"optionChainRaw":{},"atmStrike":23000}', headers={"Content-Type":"application/json"})
response = urllib.request.urlopen(req)
result = json.loads(response.read().decode())
for key, value in result.items():
    print(f"{key}: {value}")
