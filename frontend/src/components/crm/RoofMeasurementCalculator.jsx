import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

const PITCH_MULTIPLIERS = {
  '4/12': 1.0541,
  '5/12': 1.0868,
  '6/12': 1.1180,
  '7/12': 1.1576,
  '8/12': 1.2019,
  '9/12': 1.2528,
  '10/12': 1.3054,
  '12/12': 1.4142,
  'flat': 1.0,
};

const ROOF_TYPES = [
  { value: 'asphalt_shingles', label: 'Asphalt Shingles' },
  { value: 'metal', label: 'Metal Roofing' },
  { value: 'tpo', label: 'TPO Membrane' },
  { value: 'bur', label: 'BUR Membrane' },
  { value: 'tile', label: 'Tile' },
  { value: 'wood', label: 'Wood Shakes' },
];

export default function RoofMeasurementCalculator({ onCalculationComplete }) {
  const [measurements, setMeasurements] = useState({
    roofLength: 0,
    roofWidth: 0,
    pitch: '6/12',
    roofType: 'asphalt_shingles',
    stories: 1,
    numFacets: 1,
    valleys: 0,
    ridges: 0,
    hips: 0,
    eaves: 0,
    rakes: 0,
    penetrations: 0,
    wastePercentage: 10,
  });

  const calculations = useMemo(() => {
    const pitchMultiplier = PITCH_MULTIPLIERS[measurements.pitch] || 1.0;
    const baseArea = measurements.roofLength * measurements.roofWidth;
    
    // Apply pitch multiplier to get actual roof area
    const adjustedArea = baseArea * pitchMultiplier;
    
    // Convert area to roof squares (1 square = 100 sq ft)
    const roofSquares = adjustedArea / 100;
    
    // Calculate linear feet for accessories
    const ridgeLinearFeet = (measurements.ridges || 0) * (measurements.roofLength * 1.5); // Estimate
    const hipLinearFeet = (measurements.hips || 0) * (measurements.roofLength * 1.5);
    const valleyLinearFeet = (measurements.valleys || 0) * (measurements.roofLength * 2);
    const eaveLinearFeet = measurements.eaves ? measurements.eaves : measurements.roofLength * 2 * measurements.numFacets;
    const rakeLinearFeet = measurements.rakes ? measurements.rakes : measurements.roofWidth * 2 * measurements.numFacets;
    
    const totalLinearFeet = ridgeLinearFeet + hipLinearFeet + valleyLinearFeet + eaveLinearFeet + rakeLinearFeet;
    
    // Material quantities
    const sheathingSquares = roofSquares * 1.05; // 5% for overlap and waste
    const underlaymentSquares = roofSquares * 1.1; // 10% overlap
    const starterShingles = eaveLinearFeet / 3; // Approximate bundles
    const ridgeCapShingles = ridgeLinearFeet / 3;
    const icewaterShield = (valleyLinearFeet + eaveLinearFeet) / 2; // Linear feet
    
    // Accessories
    const dripEdge = totalLinearFeet;
    const flashing = (measurements.penetrations || 0) * 4; // Square feet per penetration
    const gutters = eaveLinearFeet;
    const downspouts = Math.ceil((gutters / 30) * 10); // One per 30 linear feet
    
    // Waste calculations
    const wasteFactor = 1 + (measurements.wastePercentage / 100);
    const sheathingWithWaste = sheathingSquares * wasteFactor;
    const underlaymentWithWaste = underlaymentSquares * wasteFactor;
    
    // Labor estimates (based on experience data)
    const hourPerSquare = 0.5; // Standard installation rate
    const totalLaborHours = roofSquares * hourPerSquare;
    
    // Additional labor for complexity
    const complexityFactor = 1 + ((measurements.penetrations || 0) * 0.1) + ((measurements.valleys || 0) * 0.15);
    const adjustedLaborHours = totalLaborHours * complexityFactor;
    
    return {
      roofSquares: Math.round(roofSquares * 100) / 100,
      adjustedArea: Math.round(adjustedArea * 100) / 100,
      pitchMultiplier,
      
      // Linear feet
      ridgeLinearFeet: Math.round(ridgeLinearFeet),
      hipLinearFeet: Math.round(hipLinearFeet),
      valleyLinearFeet: Math.round(valleyLinearFeet),
      eaveLinearFeet: Math.round(eaveLinearFeet),
      rakeLinearFeet: Math.round(rakeLinearFeet),
      totalLinearFeet: Math.round(totalLinearFeet),
      
      // Materials
      sheathingSquares: Math.round(sheathingWithWaste * 100) / 100,
      underlaymentSquares: Math.round(underlaymentWithWaste * 100) / 100,
      starterShingles: Math.round(starterShingles * 10) / 10,
      ridgeCapShingles: Math.round(ridgeCapShingles * 10) / 10,
      icewaterShield: Math.round(icewaterShield),
      
      // Accessories
      dripEdge: Math.round(dripEdge),
      flashing: Math.round(flashing * 10) / 10,
      gutters: Math.round(gutters),
      downspouts: Math.round(downspouts),
      
      // Labor
      laborHours: Math.round(adjustedLaborHours * 10) / 10,
      laborComplexity: Math.round(complexityFactor * 100) / 100,
    };
  }, [measurements]);

  const handleInputChange = (field, value) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: field.includes('Percentage') || field.includes('waste') ? parseFloat(value) || 0 : parseFloat(value) || 0,
    }));
  };

  const handleSelectChange = (field, value) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyCalculations = () => {
    onCalculationComplete({
      measurements,
      calculations,
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="measurements" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="calculations">Calculations</TabsTrigger>
          <TabsTrigger value="reference">Pitch Guide</TabsTrigger>
        </TabsList>

        {/* Measurements Tab */}
        <TabsContent value="measurements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Roof Measurements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Roof Length (ft)</label>
                  <Input
                    type="number"
                    value={measurements.roofLength}
                    onChange={(e) => handleInputChange('roofLength', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Roof Width (ft)</label>
                  <Input
                    type="number"
                    value={measurements.roofWidth}
                    onChange={(e) => handleInputChange('roofWidth', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Pitch</label>
                  <Select value={measurements.pitch} onValueChange={(value) => handleSelectChange('pitch', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat</SelectItem>
                      {Object.keys(PITCH_MULTIPLIERS).filter(p => p !== 'flat').map(pitch => (
                        <SelectItem key={pitch} value={pitch}>{pitch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Roof Type</label>
                  <Select value={measurements.roofType} onValueChange={(value) => handleSelectChange('roofType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOF_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Number of Stories</label>
                  <Input
                    type="number"
                    value={measurements.stories}
                    onChange={(e) => handleInputChange('stories', e.target.value)}
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Number of Facets</label>
                  <Input
                    type="number"
                    value={measurements.numFacets}
                    onChange={(e) => handleInputChange('numFacets', e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Roof Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Valleys</label>
                  <Input
                    type="number"
                    value={measurements.valleys}
                    onChange={(e) => handleInputChange('valleys', e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ridges</label>
                  <Input
                    type="number"
                    value={measurements.ridges}
                    onChange={(e) => handleInputChange('ridges', e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Hips</label>
                  <Input
                    type="number"
                    value={measurements.hips}
                    onChange={(e) => handleInputChange('hips', e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Eaves (linear ft)</label>
                  <Input
                    type="number"
                    value={measurements.eaves}
                    onChange={(e) => handleInputChange('eaves', e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Rakes (linear ft)</label>
                  <Input
                    type="number"
                    value={measurements.rakes}
                    onChange={(e) => handleInputChange('rakes', e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Penetrations</label>
                  <Input
                    type="number"
                    value={measurements.penetrations}
                    onChange={(e) => handleInputChange('penetrations', e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Waste & Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-xs text-muted-foreground">Waste Percentage (%)</label>
                <Input
                  type="number"
                  value={measurements.wastePercentage}
                  onChange={(e) => handleInputChange('wastePercentage', e.target.value)}
                  min="0"
                  max="50"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculations Tab */}
        <TabsContent value="calculations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Roof Squares</p>
                <p className="text-2xl font-bold">{calculations.roofSquares}</p>
                <p className="text-xs text-muted-foreground mt-1">{calculations.adjustedArea} sq ft</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Linear Feet</p>
                <p className="text-2xl font-bold">{calculations.totalLinearFeet}</p>
                <p className="text-xs text-muted-foreground mt-1">Ridges, Hips, Valleys</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Labor Hours</p>
                <p className="text-2xl font-bold">{calculations.laborHours}</p>
                <p className="text-xs text-muted-foreground mt-1">Complexity: {calculations.laborComplexity}x</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Material Quantities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Sheathing</p>
                  <p className="font-bold">{calculations.sheathingSquares} sq</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Underlayment</p>
                  <p className="font-bold">{calculations.underlaymentSquares} sq</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Ice & Water Shield</p>
                  <p className="font-bold">{calculations.icewaterShield} lf</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Starter Shingles</p>
                  <p className="font-bold">{calculations.starterShingles} bundles</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Ridge Cap</p>
                  <p className="font-bold">{calculations.ridgeCapShingles} bundles</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Drip Edge</p>
                  <p className="font-bold">{calculations.dripEdge} lf</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Accessories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Flashing</p>
                  <p className="font-bold">{calculations.flashing} sq ft</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Gutters</p>
                  <p className="font-bold">{calculations.gutters} lf</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Downspouts</p>
                  <p className="font-bold">{calculations.downspouts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleApplyCalculations} className="w-full gap-2" size="lg">
            <Zap className="w-4 h-4" /> Apply to Estimate
          </Button>
        </TabsContent>

        {/* Pitch Reference Tab */}
        <TabsContent value="reference">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pitch Multiplier Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  The pitch multiplier adjusts the base roof area based on the roof slope. A steeper pitch means more material is needed.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(PITCH_MULTIPLIERS).map(([pitch, multiplier]) => (
                    <div key={pitch} className="p-3 border rounded-lg">
                      <p className="font-semibold text-sm">{pitch}</p>
                      <p className="text-xs text-muted-foreground">×{multiplier.toFixed(4)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm"><span className="font-semibold">Example:</span> A 40' × 50' roof with 6/12 pitch = 2,000 sq ft × 1.118 = 2,236 sq ft = 22.36 squares</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}