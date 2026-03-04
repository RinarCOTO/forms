"use client";

import { ReactNode, useEffect, useState } from "react";

type SectionHeaderProps = { children: ReactNode; colSpan?: number; className?: string };
const SectionHeader = ({ children, colSpan = 3, className = "" }: SectionHeaderProps) => (
  <tr>
    <td colSpan={colSpan} className={`font-bold ${className}`}>
      {children}
    </td>
  </tr>
);

const MUNICIPALITY_MAP: Record<string, string> = { paracelis: 'paracellis' };

const FaasFooter = ({ amountInWords, locationMunicipality }: { amountInWords: string; locationMunicipality?: string }) => {
  const [provincialAssessorName, setProvincialAssessorName] = useState('');
  const [municipalAssessorName, setMunicipalAssessorName] = useState('');

  useEffect(() => {
    fetch('/api/users/by-role?role=provincial_assessor')
      .then(res => res.json())
      .then(data => {
        if (data.users?.[0]?.full_name) {
          setProvincialAssessorName(data.users[0].full_name);
        }
      });
  }, []);

  useEffect(() => {
    if (!locationMunicipality) return;
    const normalized = locationMunicipality.toLowerCase();
    const municipality = MUNICIPALITY_MAP[normalized] ?? normalized;
    fetch(`/api/users/by-role?role=municipal_tax_mapper&municipality=${municipality}`)
      .then(res => res.json())
      .then(data => {
        if (data.users?.[0]?.full_name) {
          setMunicipalAssessorName(data.users[0].full_name);
        }
      });
  }, [locationMunicipality]);

  return (
    <div>
        <div className="w-full flex gap-12">
            <div>Amount in Words:</div>
            <div className="uppercase border-b border-black">{amountInWords ? `${amountInWords} Pesos Only` : '—'}</div>
        </div>
        <div className="grid grid-cols-4 items-center">
          <label className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-4 h-4 border border-black">
              x
            </span>
            <span>Taxable</span>
          </label>

          <label className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-4 h-4 border border-black">
              x
            </span>
            <span>Exempt</span>
          </label>

          <div>Effectivity of Assessment:</div>
          <div>Date</div>
        </div>
        <div className="grid grid-cols-3 mt-6">
            <div>Assessed by:</div>
            <div>Recomending Approval:</div>
            <div>Approved by:</div>
        </div>
        <div className="grid grid-cols-3 text-center mt-6">
            <div>
                <span className="inline-block border-b border-black w-3/4 mx-auto font-bold">Name of ...</span>
            </div>
            <div>
                <span className="inline-block border-b border-black w-3/4 mx-auto font-bold">{municipalAssessorName || 'Name of Municipal Assessor'}</span>
            </div>
            <div>
                <span className="inline-block border-b border-black w-3/4 mx-auto font-bold">{provincialAssessorName || 'Name of Provincial Assessor'}</span>
            </div>
        </div>
        <div className="grid grid-cols-3 mt-{2} text-center">
            <div>Position</div>
            <div>Municipal Assessor</div>
            <div>Provincial Assessor</div>
        </div>
        <div>
            <table>
                <tbody>
                <SectionHeader colSpan={5}>Memoranda:</SectionHeader>
                    <tr>
                        <td colSpan={5}>text here</td>
                    </tr>
                    <tr>
                        <td>Prev. TD:</td>
                        <td>value here</td>
                        <td>
                            <div className="grid grid-cols-3">
                                <div className="col-span-2">Prev. AV:</div>
                                <div className="col-span-1 border-l border-black pl-2">test</div>
                            </div>
                        </td>
                        <td className="text-left">Prev. Area</td>
                        <td>value</td>
                    </tr>
                    <tr>
                        <td>Prev. Owner:</td>
                        <td></td>
                        <td>
                            <div className="grid grid-cols-3">
                                <div className="col-span-2">Prev. MV:</div>
                                <div className="col-span-1 border-l border-black pl-2">test</div>
                            </div>
                        </td>
                        <td>Effectively Assessment:</td>
                        <td>value</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    );
};

export default FaasFooter;
