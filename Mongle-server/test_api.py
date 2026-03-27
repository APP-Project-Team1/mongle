import requests

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(path):
    try:
        response = requests.get(f"{BASE_URL}{path}")
        print(f"Testing {path}: Status {response.status_code}")
        if response.status_code == 200:
            print(f"  Result: {str(response.json())[:100]}...")
        else:
            print(f"  Error: {response.text}")
    except Exception as e:
        print(f"  Failed: {e}")

if __name__ == "__main__":
    test_endpoint("/")
    test_endpoint("/vendors/")
    test_endpoint("/timelines/")
    test_endpoint("/projects/test")
