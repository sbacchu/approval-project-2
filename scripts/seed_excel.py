import pandas as pd
import os

data = [
    {"date": "2023-01-01", "series": "GDP", "value": 100, "units": "Billion USD"},
    {"date": "2023-02-01", "series": "GDP", "value": 102, "units": "Billion USD"},
    {"date": "2023-01-01", "series": "CPI", "value": 2.5, "units": "Percent"},
    {"date": "2023-02-01", "series": "CPI", "value": 2.6, "units": "Percent"},
    {"date": "2023-01-01", "series": "Unemployment", "value": 3.5, "units": "Percent"},
    {"date": "2023-02-01", "series": "Unemployment", "value": 3.4, "units": "Percent"}
]

df = pd.DataFrame(data)
df.to_excel("sample_data/sample_econ_data.xlsx", index=False)
print("Created sample_data/sample_econ_data.xlsx")
