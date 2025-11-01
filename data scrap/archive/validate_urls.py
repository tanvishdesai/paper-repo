"""
URL Validation Utility
Validates GATE paper URLs before scraping
"""

import requests
from urllib.parse import urlparse
import re
from typing import List, Tuple, Dict


class URLValidator:
    """Validates GATE paper URLs."""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def is_valid_url(self, url: str) -> bool:
        """Check if URL has valid format."""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except Exception:
            return False
    
    def is_gate_paper_url(self, url: str) -> bool:
        """Check if URL matches GATE paper pattern."""
        gate_pattern = r'geeksforgeeks\.org/quizzes/gate-cs-\d{4}'
        return bool(re.search(gate_pattern, url, re.IGNORECASE))
    
    def test_connection(self, url: str, timeout: int = 10) -> Tuple[bool, str]:
        """Test if URL is accessible."""
        try:
            response = self.session.head(url, timeout=timeout, allow_redirects=True)
            if response.status_code == 200:
                return True, "✓ Accessible"
            else:
                return False, f"✗ HTTP {response.status_code}"
        except requests.Timeout:
            return False, "✗ Timeout"
        except requests.ConnectionError:
            return False, "✗ Connection Error"
        except Exception as e:
            return False, f"✗ Error: {str(e)[:50]}"
    
    def extract_year(self, url: str) -> str:
        """Extract year from URL."""
        match = re.search(r'gate-cs-(\d{4})', url)
        if match:
            return match.group(1)
        return "Unknown"
    
    def validate_urls(self, urls: List[str], test_connection: bool = True) -> Tuple[List[Dict], List[Dict]]:
        """
        Validate multiple URLs.
        Returns (valid_urls, invalid_urls)
        """
        valid_urls = []
        invalid_urls = []
        
        for url in urls:
            result = {
                'url': url,
                'year': self.extract_year(url),
                'valid': False,
                'reason': ''
            }
            
            # Check format
            if not self.is_valid_url(url):
                result['reason'] = "Invalid URL format"
                invalid_urls.append(result)
                continue
            
            # Check GATE pattern
            if not self.is_gate_paper_url(url):
                result['reason'] = "Does not match GATE paper URL pattern"
                invalid_urls.append(result)
                continue
            
            # Test connection if requested
            if test_connection:
                accessible, message = self.test_connection(url)
                if not accessible:
                    result['reason'] = message
                    invalid_urls.append(result)
                    continue
                result['reason'] = message
            
            result['valid'] = True
            valid_urls.append(result)
        
        return valid_urls, invalid_urls
    
    def print_report(self, valid_urls: List[Dict], invalid_urls: List[Dict]):
        """Print validation report."""
        print("\n" + "=" * 80)
        print("GATE Paper URL Validation Report")
        print("=" * 80)
        
        if valid_urls:
            print(f"\n✅ Valid URLs ({len(valid_urls)}):")
            print("-" * 80)
            for item in valid_urls:
                print(f"  Year {item['year']}: {item['reason']}")
                print(f"    {item['url']}")
        
        if invalid_urls:
            print(f"\n❌ Invalid URLs ({len(invalid_urls)}):")
            print("-" * 80)
            for item in invalid_urls:
                print(f"  [{item['reason']}]")
                print(f"    {item['url']}")
        
        print("\n" + "=" * 80)
        print(f"Summary: {len(valid_urls)} valid, {len(invalid_urls)} invalid")
        print("=" * 80 + "\n")


def main():
    """Main function."""
    from urls_config import GATE_PAPER_URLS
    
    validator = URLValidator()
    
    print("\n🔍 Validating GATE Paper URLs...\n")
    
    valid_urls, invalid_urls = validator.validate_urls(GATE_PAPER_URLS, test_connection=True)
    
    validator.print_report(valid_urls, invalid_urls)
    
    if invalid_urls:
        print("⚠️  Please fix invalid URLs in urls_config.py before running the scraper.\n")
        return 1
    
    if valid_urls:
        print("✅ All URLs are valid! You can now run: python run_scraper.py\n")
        return 0
    
    print("❌ No valid URLs found!\n")
    return 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
