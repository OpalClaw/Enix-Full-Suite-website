import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const DEFAULT_SETTINGS = {
  waste_percentage: 10,
  labor_rate_per_hour: 85,
  labor_hours_per_square: 0.5,
  complexity_penetration_multiplier: 0.1,
  complexity_valley_multiplier: 0.15,
  sheathing_overlap_percentage: 5,
  underlayment_overlap_percentage: 10,
  ice_water_shield_coverage_ratio: 0.5,
  starter_shingles_per_linear_ft: 0.33,
  ridge_cap_per_linear_ft: 0.33,
  downspout_spacing_feet: 30,
  flashing_per_penetration_sq_ft: 4,
  default_pitch: '6/12',
};

export function useRoofCalculatorSettings() {
  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey: ['roofCalculatorSettings'],
    queryFn: async () => {
      try {
        const results = await base44.entities.RoofCalculatorSettings.filter({ setting_name: 'default' });
        return results[0] || DEFAULT_SETTINGS;
      } catch (error) {
        console.error('Error fetching roof calculator settings:', error);
        return DEFAULT_SETTINGS;
      }
    },
  });

  return {
    settings: { ...DEFAULT_SETTINGS, ...settings },
    isLoading,
  };
}