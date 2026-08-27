from __future__ import annotations

import unittest
from datetime import datetime
from zoneinfo import ZoneInfo


class TimezoneSupportTests(unittest.TestCase):
    def test_america_santiago_is_available(self) -> None:
        timezone = ZoneInfo("America/Santiago")
        current = datetime.now(timezone)
        self.assertIsNotNone(current.utcoffset())
        self.assertEqual(getattr(timezone, "key", None), "America/Santiago")


if __name__ == "__main__":
    unittest.main()
