import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.seylan.checksum import checksum_b64, build_pipe


def test_checksum_annexure_sample():
    # Verified sample from Seylan API manual Annexure 1
    pipe = build_pipe("272006210017", "23085000000112", "23000383",
                      "API_testAPI57390", "1", "10", "88675777", "7788998877")
    assert pipe == "272006210017|23085000000112|23000383|API_testAPI57390|1|10|88675777|7788998877"

    result = checksum_b64("ar2t3nqh185wiro8zq0wzpcana6010ju", pipe)
    expected = "QTMxNEEyMThGODUwMTAxOTFEQ0Q2RTI2QkE5NkZGRDhBQkQ1MjYyQUY0OUEzQ0VEOUEyQkI5ODA3RkREMTU0ODgwN0E3ODUyM0Q5Q0ZFMTRFNTRFNEZDNjg3N0EzMjI4NzdCNTMzQzI5QjJBOUU0ODRCRDIzQzE3NjY4REUwRjQ="
    assert result == expected, f"Got: {result}"
    print("PASS test_checksum_annexure_sample")


def test_empty_fields():
    # Empty Tid case from Annexure notes
    pipe = build_pipe("272006210017", "23085000000112", "", "API_testAPI57390", "1", "10", "88675777", "7788998877")
    assert "||" in pipe
    print("PASS test_empty_fields")


if __name__ == "__main__":
    test_checksum_annexure_sample()
    test_empty_fields()
    print("\nAll checksum tests passed.")