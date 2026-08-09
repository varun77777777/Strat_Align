import unittest

from ai_simulator import _mock_analyze


class StrategyFallbackTests(unittest.TestCase):
    strategy = "Prioritize hybrid cloud and artificial intelligence transformation."

    def test_strategy_terms_are_extracted_from_the_supplied_document(self):
        result = _mock_analyze(self.strategy, ["Hybrid cloud supports our intelligence roadmap."])
        self.assertIn("hybrid", result["strategyKeywords"])
        self.assertIn("cloud", result["strategyKeywords"])

    def test_aligned_communication_scores_higher_than_drifting_communication(self):
        aligned = _mock_analyze(
            self.strategy,
            ["Our hybrid cloud migration advances the artificial intelligence transformation."],
        )
        drifting = _mock_analyze(
            self.strategy,
            ["We are maintaining legacy systems and have no idea what the priorities are."],
        )
        self.assertGreater(aligned["alignmentScore"], drifting["alignmentScore"])
        self.assertGreater(aligned["mentionRate"], drifting["mentionRate"])
        self.assertTrue(drifting["driftSignals"])


if __name__ == "__main__":
    unittest.main()
