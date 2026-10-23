from ingestion.pipeline import prepare_dataset

file_path = r"D:\Download\metricwatch_test_data.csv"

result = prepare_dataset(
    file_path=file_path,
    date_column="date",
    metric_columns=[
        "website_visits",
        "orders",
        "revenue",
        "conversion_rate",
        "ad_spend",
    ],
)

print("\n--- DATASET SUMMARY ---")
print("Filename:", result["filename"])
print("Original rows:", result["original_row_count"])
print("Columns:", result["original_column_count"])
print("Cleaned rows:", result["cleaned_row_count"])
print("Quality issues:", result["quality_issue_count"])

print("\n--- PROFILE ---")
print("Date candidates:", result["profile"]["candidate_date_columns"])
print("Numeric candidates:", result["profile"]["candidate_numeric_columns"])

print("\n--- QUALITY ISSUES ---")
for issue in result["quality_issues"]:
    print(issue)

print("\n--- FIRST 5 CLEANED ROWS ---")
print(result["cleaned_df"].head())