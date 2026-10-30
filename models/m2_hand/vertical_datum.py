# models/m2_hand/vertical_datum.py
"""
Vertical Reference and Height Above Nearest Drainage (HAND) Formulation.

Datum Standards & Source Attribution:
- Digital Elevation Model (DEM): Copernicus DEM GLO-30 (30-meter resolution).
  Vertical Datum: Earth Gravitational Model 2008 (EGM2008) geoid.
  Horizontal Datum: WGS84 (EPSG:4326).
- River Telemetry (CWC / Gauges): Local gauge datum (meters above mean sea level).
- Reach Calibration: Indus Basin (Ravi & Sutlej-Beas reach).

Mathematical Derivation:
1. channel_bed_m: Elevation of nearest drainage channel cell (EGM2008, m).
2. bank_m: Elevation of channel bank (EGM2008, m).
3. bank_height_above_channel: H_bank = bank_m - channel_bed_m (m).
4. ground_m: Surface elevation of village centroid (EGM2008, m).
5. hand_m: HAND = ground_m - channel_bed_m (m).
6. stage_above_bank: River level rise above bank crest (m).

True water surface elevation:
  z_water = bank_m + stage_above_bank = channel_bed_m + H_bank + stage_above_bank

True ground surface elevation:
  z_ground = channel_bed_m + hand_m

Inundation Depth:
  depth = max(0, z_water - z_ground)
        = max(0, (stage_above_bank + bank_height_above_channel) - hand_m)

Notice that channel_bed_m cancels out, eliminating regional geoid tilt errors.
"""

def compute_inundation_depth(stage_above_bank: float, bank_height_above_channel: float, hand_m: float) -> float:
    """
    Compute physical flood depth at ground point using unified reference.
    
    Args:
        stage_above_bank: Water level above river bank (m). 0 = bankfull flow.
        bank_height_above_channel: Height of river bank above channel bed (m).
        hand_m: Height Above Nearest Drainage of the ground point (m).
        
    Returns:
        depth: Water depth on ground in meters (>= 0).
    """
    if hand_m is None or bank_height_above_channel is None:
        return 0.0
    effective_water_head = stage_above_bank + bank_height_above_channel
    depth = max(0.0, effective_water_head - hand_m)
    return round(depth, 3)

def generate_stage_depth_table(
    bank_height_above_channel: float,
    hand_m: float,
    stages: list = None
) -> list:
    """
    Generate stage-to-depth lookup table [[stage_above_bank, depth], ...].
    """
    if stages is None:
        stages = [0.0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0]
    
    table = []
    for s in stages:
        d = compute_inundation_depth(s, bank_height_above_channel, hand_m)
        table.append([round(float(s), 2), round(float(d), 3)])
    return table
