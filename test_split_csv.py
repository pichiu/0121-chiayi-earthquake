import unittest
import os
import pandas as pd
import sys # Added for mocking sys.argv
import argparse # split_csv.py uses it, good to have if needed for future test details
from split_csv import filter_address_data, main as split_csv_main # Assuming split_csv.py is in the same directory

class TestSplitCsvPy(unittest.TestCase):

    def setUp(self):
        """Set up for test methods."""
        self.test_input_csv = "test_data/test_split_input.csv" # Pre-existing file
        self.output_csv_path_match = "test_split_output_match.csv"
        self.output_csv_path_no_match = "test_split_output_no_match.csv"
        self.empty_input_csv = "empty_test_input.csv"

        # For main function integration tests
        self.main_output_match_csv = "test_split_main_output_match.csv"
        self.main_output_no_match_csv = "test_split_main_output_no_match.csv"

        # Ensure the test_input_csv exists before running tests that depend on it
        if not os.path.exists(self.test_input_csv) and (
            "test_filter_address_data_match_found" in self._testMethodName or 
            "test_filter_address_data_no_match" in self._testMethodName or
            "test_main_function_integration_match" in self._testMethodName or
            "test_main_function_integration_no_match" in self._testMethodName):
            raise FileNotFoundError(f"Required test input file not found: {self.test_input_csv}")

    def tearDown(self):
        """Tear down test methods."""
        if os.path.exists(self.output_csv_path_match):
            os.remove(self.output_csv_path_match)
        if os.path.exists(self.output_csv_path_no_match):
            os.remove(self.output_csv_path_no_match)
        if os.path.exists(self.empty_input_csv):
            os.remove(self.empty_input_csv)
        
        # Cleanup for main function integration test outputs
        if os.path.exists(self.main_output_match_csv):
            os.remove(self.main_output_match_csv)
        if os.path.exists(self.main_output_no_match_csv):
            os.remove(self.main_output_no_match_csv)

    def test_filter_address_data_match_found(self):
        """Test filter_address_data when a match is expected."""
        district_code = "100" 
        village_name = "成功里" 

        filter_address_data(self.test_input_csv, district_code, village_name, self.output_csv_path_match)

        self.assertTrue(os.path.exists(self.output_csv_path_match), "Output CSV file for matched data was not created.")
        df_output = pd.read_csv(self.output_csv_path_match, dtype={'鄉鎮市區代碼': str})
        self.assertFalse(df_output.empty, "Output CSV for matched data is empty.")
        self.assertTrue((df_output['鄉鎮市區代碼'] == district_code).all(), "Not all rows match the district code.")
        self.assertTrue((df_output['村里'] == village_name).all(), "Not all rows match the village name.")
        self.assertEqual(len(df_output), 1, "Incorrect number of rows in matched output.")

    def test_filter_address_data_no_match(self):
        """Test filter_address_data when no match is expected."""
        district_code = "999" 
        village_name = "無此里" 
        filter_address_data(self.test_input_csv, district_code, village_name, self.output_csv_path_no_match)
        self.assertFalse(os.path.exists(self.output_csv_path_no_match), 
                         "Output CSV file was created even when no match was expected.")

    def test_filter_address_data_empty_input(self):
        """Test filter_address_data with an empty input CSV."""
        pd.DataFrame(columns=['鄉鎮市區代碼', '村里', '其他資料欄位A', '其他資料欄位B']).to_csv(
            self.empty_input_csv, index=False, encoding='utf-8'
        )
        filter_address_data(self.empty_input_csv, "100", "成功里", self.output_csv_path_no_match)
        self.assertFalse(os.path.exists(self.output_csv_path_no_match),
                         "Output CSV file was created for empty input.")

    def test_main_function_integration_match(self):
        """Test main function integration when a match is expected."""
        input_csv = self.test_input_csv
        district_code = "100"
        village_name = "成功里"
        output_csv = self.main_output_match_csv

        original_argv = sys.argv
        sys.argv = ['split_csv.py', '-i', input_csv, '-d', district_code, '-v', village_name, '-o', output_csv]
        
        split_csv_main()
        
        sys.argv = original_argv

        self.assertTrue(os.path.exists(output_csv), f"Main function did not create output file: {output_csv}")
        df_output = pd.read_csv(output_csv, dtype={'鄉鎮市區代碼': str})
        self.assertFalse(df_output.empty, f"Main function created an empty output file: {output_csv}")
        self.assertTrue((df_output['鄉鎮市區代碼'] == district_code).all(), "Not all rows match the district code in main output.")
        self.assertTrue((df_output['村里'] == village_name).all(), "Not all rows match the village name in main output.")
        # Based on test_data/test_split_input.csv:
        # 100,成功里,資料1,資料A
        self.assertEqual(len(df_output), 1, "Incorrect number of rows in main matched output.")

    def test_main_function_integration_no_match(self):
        """Test main function integration when no match is expected."""
        input_csv = self.test_input_csv
        district_code = "999" # Non-existent district code
        village_name = "無此里" # Non-existent village name
        output_csv_no_match = self.main_output_no_match_csv

        original_argv = sys.argv
        sys.argv = ['split_csv.py', '-i', input_csv, '-d', district_code, '-v', village_name, '-o', output_csv_no_match]
        
        split_csv_main()
        
        sys.argv = original_argv

        self.assertFalse(os.path.exists(output_csv_no_match), 
                         f"Main function created an output file when no match was expected: {output_csv_no_match}")

if __name__ == '__main__':
    unittest.main()
