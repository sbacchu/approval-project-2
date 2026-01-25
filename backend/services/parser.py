import pandas as pd
import io
from typing import List, Tuple, Dict, Any, Optional
import datetime

REQUIRED_COLUMNS = ["date", "series", "value"]

HEADER_MAP = {
    "date": ["date", "period", "time"],
    "series": ["series", "indicator", "variable", "ticker"],
    "value": ["value", "observation", "val"],
    "vintage_date": ["vintage", "as_of", "asof", "revision_date"]
}

def normalize_header(header: str) -> str:
    h = str(header).lower().strip().replace(" ", "_")
    for canonical, synonyms in HEADER_MAP.items():
        if h in synonyms:
            return canonical
    return h

def parse_excel(file_content: bytes, filename: str) -> Tuple[List[Dict], List[str], List[Dict], int]:
    try:
        if filename.endswith(".xls"):
            # Start with openpyxl for xlsx, xls requires xlrd. 
            # If xlrd is missing pandas will raise error.
            engine = None 
        else:
            engine = "openpyxl"
            
        df = pd.read_excel(io.BytesIO(file_content), engine=engine, sheet_name=0)
    except Exception as e:
        raise ValueError(f"Failed to parse Excel: {str(e)}")

    # Normalize headers
    df.columns = [normalize_header(c) for c in df.columns]
    
    # Check required
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")

    observations = []
    warnings = []
    
    columns = list(df.columns)
    
    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        obs = {
            "row_index": idx + 2, # 1-header, 0-index start -> row 2 is index 0
            "date": None,
            "series": None,
            "value_num": None,
            "value_text": None,
            "frequency": row_dict.get("frequency"),
            "units": row_dict.get("units"),
            "country": row_dict.get("country") or row_dict.get("region"),
            "source": row_dict.get("source"),
            "vintage_date": None,
            "notes": row_dict.get("notes"),
            "raw": {k: str(v) for k, v in row_dict.items() if pd.notnull(v)}
        }
        
        # Validations
        # Series
        obs["series"] = str(row_dict["series"]) if pd.notnull(row_dict["series"]) else None
        if not obs["series"]:
            warnings.append({"row": idx + 2, "error": "Missing series"})
            # We skip rows without series? Or store them? 
            # If series is missing, it's pretty useless.
            # But let's proceed to see if we can rescue other data? No.
            continue
            
        # Date
        raw_date = row_dict["date"]
        # Try to parse date
        try:
            if pd.isnull(raw_date):
                 warnings.append({"row": idx + 2, "error": "Missing date"})
                 # Skip if no date?
                 continue
            obs["date"] = pd.to_datetime(raw_date).strftime("%Y-%m-%d")
        except:
             # Fallback to string
             obs["date"] = str(raw_date)

        # Value
        val = row_dict["value"]
        if pd.api.types.is_number(val) and not pd.isna(val):
            obs["value_num"] = float(val)
        else:
            if pd.notnull(val):
                obs["value_text"] = str(val)
        
        if obs["value_num"] is None and obs["value_text"] is None:
             warnings.append({"row": idx + 2, "error": "Missing value"})
        
        # Vintage date
        v_date = row_dict.get("vintage_date")
        if v_date and pd.notnull(v_date):
             try:
                 obs["vintage_date"] = pd.to_datetime(v_date).strftime("%Y-%m-%d")
             except:
                 obs["vintage_date"] = str(v_date)

        observations.append(obs)

    return observations, columns, warnings, len(df)
