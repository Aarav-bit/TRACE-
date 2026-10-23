import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Dict, List, Tuple
from backend.forensic.parsers.json_csv_parser import normalize_event_record

def parse_evtx_file(file_path: Path) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Parses Windows Event Log (.evtx) files using python-evtx.
    Extracts XML structures and normalizes key Windows Event schema tags.
    """
    warnings = []
    records = []

    try:
        import Evtx.Evtx as evtx_module

        with evtx_module.Evtx(str(file_path)) as log:
            for idx, record in enumerate(log.records(), start=1):
                try:
                    xml_str = record.xml()
                    # Parse XML to dict
                    root = ET.fromstring(xml_str)
                    # Strip namespace prefixes for easier navigation
                    for elem in root.iter():
                        if "}" in elem.tag:
                            elem.tag = elem.tag.split("}", 1)[1]

                    event_data = {}
                    # System headers
                    sys_node = root.find("System")
                    if sys_node is not None:
                        eid_node = sys_node.find("EventID")
                        if eid_node is not None:
                            event_data["event_id"] = eid_node.text

                        time_node = sys_node.find("TimeCreated")
                        if time_node is not None and "SystemTime" in time_node.attrib:
                            event_data["timestamp"] = time_node.attrib["SystemTime"]

                        rec_node = sys_node.find("EventRecordID")
                        if rec_node is not None:
                            event_data["record_id"] = rec_node.text

                        channel_node = sys_node.find("Channel")
                        if channel_node is not None:
                            event_data["Channel"] = channel_node.text

                    # EventData / UserData payload
                    ed_node = root.find("EventData")
                    if ed_node is not None:
                        for data_child in ed_node.findall("Data"):
                            name = data_child.attrib.get("Name")
                            val = data_child.text
                            if name and val:
                                event_data[name] = val

                    records.append(normalize_event_record(event_data, idx))
                except Exception as rec_err:
                    warnings.append(f"EVTX record {idx} parse failure: {rec_err}")

    except ImportError:
        warnings.append("python-evtx library not available. Please install python-evtx.")
    except Exception as e:
        warnings.append(f"EVTX header parsing failed: {str(e)}")

    return records, warnings
