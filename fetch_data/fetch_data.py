import openai
import base64
import json
import os
from pathlib import Path
import requests
import tempfile
import re
from datetime import datetime, timedelta
import glob


openai.api_key = os.getenv("OPENAI_API_KEY")  # Replace with your API key

client = openai.OpenAI()


def parse_image(img_path, date):
    # Load image as base64
    img_path = Path(img_path)
    b64_image = base64.b64encode(img_path.read_bytes()).decode("utf-8")

    # Define tool (function schema)
    tools = [
        {
            "type": "function",
            "function": {
                "name": "extract_river_bulletin",
                "description": "Extract data from a river bulletin into structured JSON format",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "dams": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                "name": {"type": "string"},
                                "level_min_ft": {"type": "number"},
                                "level_max_ft": {"type": "number"},
                                "level_today_ft": {"type": "number"},
                                "inflow_upstream_cusecs": {"type": "number"},
                                "outflow_downstream_cusecs": {"type": "number"},
                                "design_discharge_cusecs": {"type": "number"},
                                "withdrawals_cusecs": {"type": "number"},
                                "accord_cusecs": {"type": "number"}
                                },
                                "required": ["name"]
                            }
                        },
                        "punjab_withdrawals": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                "name": {"type": "string"},
                                "design_discharge_cusecs": {"type": "number"},
                                "withdrawals_cusecs": {"type": "number"},
                                "accord_cusecs": {"type": "number"}
                                },
                                "required": ["name"]
                            }
                        },
                        "barrages":{
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                "name": {"type": "string"},
                                "river_level_upstream_ft": {"type": "number"},
                                "river_level_downstream_ft": {"type": "number"},
                                "river_discharge_upstream_cusecs": {"type": "number"},
                                "river_discharge_downstream_cusecs": {"type": "number"},
                                },
                                "required": ["name"]
                            }
                        },
                        "canals":{
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                "name": {"type": "string"},
                                "design_discharge_cusecs": {"type": "number"},
                                "accord_cusecs": {"type": "number"},
                                "withdrawals_cusecs": {"type": "number"},
                                },
                                "required": ["name"]
                            }
                        }
                    },

                    "required": ["dams", "punjab_withdrawals", "barrages", "canals"]
                }
            }
        }
    ]

    # Create the chat completion request
    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0,
        messages=[
            {"role": "system", "content": "You extract data from Indus River bulletins."},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Please extract the structured data from this image using the provided schema. Date formats are in DD-MM-YYYY."},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_image}"}}
                ]
            }
        ],
        tools=tools,
        tool_choice={"type": "function", "function": {"name": "extract_river_bulletin"}}
    )

    # Parse structured output
    tool_call = response.choices[0].message.tool_calls[0]
    structured_data = json.loads(tool_call.function.arguments)
    structured_data["date"] = date

    return structured_data


def iterate_through_urls(url_list, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    for url in url_list:
        try:
            print(f"Processing {url}")
            img = requests.get(url).content
            ## Save to temp file and parse
            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
                temp_file.write(img)
                date = re.search(r"IMG-(\d{8})", url).group(1)
                date = datetime.strptime(date, "%Y%m%d").strftime("%Y-%m-%d")
                output_path = os.path.join(output_dir, f"{date}.json")
                output = parse_image(temp_file.name, date)

                with open(output_path, "w") as f:
                    json.dump(output, f, indent=4)
                print(f"Saved {date} to {output_path}")
                # Delete temp file
                os.unlink(temp_file.name)
        except Exception as e:
            print(f"Failed to process {url}: {e}")


def populate_file_list():
    files = glob.glob("./public/data/*.json")
    files = [os.path.basename(f) for f in files if os.path.basename(f) != "file_list.json"]
    file_output = {
        "files": files
    }
    
    with open("./public/data/file_list.json", "w") as f:
        json.dump(file_output, f, indent=4)
    

# start_date = datetime(2025, 1, 8)
# step_days = 7
# end_date = datetime.today()

# date = start_date
# urls = []
# while date < end_date:
#     urls.append(f'https://irrigation.sindh.gov.pk/files/Flows/IndusRiver/IMG-{date.strftime("%Y%m%d")}-web08042022.png')
#     date += timedelta(days=step_days)

# print(urls[0:5])

# iterate_through_urls(urls, "./public/data")

populate_file_list()

    
