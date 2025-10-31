"""
Configuration file for GATE exam paper URLs
Add all the years you want to scrape here
"""

# List of GATE CS exam paper URLs organized by year
GATE_PAPER_URLS = [
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2025-set-1/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2025-set-2/",
    "https://www.geeksforgeeks.org/quizzes/gate-da-2025/",
    "https://www.geeksforgeeks.org/quizzes/gate-cse-2024-2/",
    "https://www.geeksforgeeks.org/quizzes/gate-cse-2024-set-2/",
    "https://www.geeksforgeeks.org/quizzes/gate-da-2024/?page=1",
    "https://www.geeksforgeeks.org/quizzes/gate-cse-2023-6/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2022-23/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2021-set-1-2/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2021-set-2-2/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2020/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2019/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2018/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2017-set-1-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2017-set-2-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2016-set-1-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2016-set-2-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2015-set-1-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2015-set-2-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2015-set-3-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2014-set-1-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2014-set-2-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2014-set-3-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2013-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-2012-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2011-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2010-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2009-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2008-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-it-2008-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2007-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-it-2007-2-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2006-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-it-2006-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2005-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-it-2005-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2004-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-it-2004-3-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2003-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2002-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2001-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-2000-gq/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-1999/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-1998/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-1997/",
    "https://www.geeksforgeeks.org/quizzes/gate-cs-1996/",
]
# Output directory for CSV files
OUTPUT_DIRECTORY = "."

# Number of seconds to wait between requests (to be respectful to the server)
REQUEST_DELAY = 0.5

# Number of seconds to wait between different papers
PAPER_DELAY = 2
