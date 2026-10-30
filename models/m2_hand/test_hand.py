# models/m2_hand/test_hand.py
import pytest
from models.m2_hand.vertical_datum import compute_inundation_depth, generate_stage_depth_table

def test_unified_vertical_datum_formulation():
    # Benchmark: Amritsar floodplain
    # Channel bed: 228.0 m (EGM2008)
    # Bank height: 4.0 m (Bank elevation: 232.0 m)
    # Village centroid ground elevation: 234.0 m -> HAND = 234.0 - 228.0 = 6.0 m
    
    bank_height = 4.0
    hand_m = 6.0

    # 1. At bankfull flow (stage_above_bank = 0.0m)
    # Water surface = 232.0m, Ground = 234.0m -> depth = 0m
    d0 = compute_inundation_depth(stage_above_bank=0.0, bank_height_above_channel=bank_height, hand_m=hand_m)
    assert d0 == 0.0

    # 2. At 1.0m above bank (stage_above_bank = 1.0m)
    # Water surface = 233.0m, Ground = 234.0m -> depth = 0m (water is 1m below ground)
    d1 = compute_inundation_depth(stage_above_bank=1.0, bank_height_above_channel=bank_height, hand_m=hand_m)
    assert d1 == 0.0

    # 3. At 2.0m above bank (stage_above_bank = 2.0m)
    # Water surface = 234.0m, Ground = 234.0m -> waterline reaches ground edge (depth = 0m)
    d2 = compute_inundation_depth(stage_above_bank=2.0, bank_height_above_channel=bank_height, hand_m=hand_m)
    assert d2 == 0.0

    # 4. At 3.5m above bank (stage_above_bank = 3.5m)
    # Water surface = 235.5m, Ground = 234.0m -> depth = 1.5m
    d3 = compute_inundation_depth(stage_above_bank=3.5, bank_height_above_channel=bank_height, hand_m=hand_m)
    assert d3 == 1.5

    # Verification against absolute elevations:
    z_water = (228.0 + bank_height + 3.5) # 235.5 m
    z_ground = (228.0 + hand_m)          # 234.0 m
    assert d3 == round(z_water - z_ground, 3)

def test_stage_depth_table_generation():
    bank_height = 3.0
    hand_m = 4.0
    # Water reaches bank at stage 0, reaches ground at stage 1.0m (3.0 + 1.0 - 4.0 = 0)
    table = generate_stage_depth_table(bank_height_above_channel=bank_height, hand_m=hand_m)
    assert len(table) == 7
    # stage 0.0 -> depth 0.0
    assert table[0] == [0.0, 0.0]
    # stage 1.0 -> depth 0.0
    assert table[2] == [1.0, 0.0]
    # stage 2.0 -> depth 1.0 (3+2-4 = 1.0)
    assert table[4] == [2.0, 1.0]
    # stage 4.0 -> depth 3.0 (3+4-4 = 3.0)
    assert table[6] == [4.0, 3.0]
