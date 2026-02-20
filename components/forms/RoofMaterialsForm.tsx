"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RoofMaterials { reinforcedConcrete: boolean; longspanRoof: boolean; tiles: boolean; giSheets: boolean; aluminum: boolean; others: boolean; }
export function RoofMaterialsForm({ materials, setMaterials, materialsOtherText, setMaterialsOtherText }: { materials: RoofMaterials; setMaterials: React.Dispatch<React.SetStateAction<RoofMaterials>>; materialsOtherText: string; setMaterialsOtherText: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={materials.reinforcedConcrete} onChange={() => setMaterials((s) => ({ ...s, reinforcedConcrete: !s.reinforcedConcrete }))} /> Reinforced Concrete
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={materials.longspanRoof} onChange={() => setMaterials((s) => ({ ...s, longspanRoof: !s.longspanRoof }))} /> Longspan Roof
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={materials.tiles} onChange={() => setMaterials((s) => ({ ...s, tiles: !s.tiles }))} /> Tiles
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={materials.giSheets} onChange={() => setMaterials((s) => ({ ...s, giSheets: !s.giSheets }))} /> G.I. Sheets
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={materials.aluminum} onChange={() => setMaterials((s) => ({ ...s, aluminum: !s.aluminum }))} /> Aluminum
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={materials.others} onChange={() => setMaterials((s) => ({ ...s, others: !s.others }))} /> Others
        <Input type="text" value={materialsOtherText} onChange={(e) => setMaterialsOtherText(e.target.value)} placeholder="Specify" className="rpfaas-fill-input ml-2 flex-1" disabled={!materials.others} />
      </label>
    </div>
  );
}
