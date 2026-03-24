"use client";

import { ReactNode, useEffect, useState } from "react";

type SectionHeaderProps = { children: ReactNode; colSpan?: number; className?: string };
const SectionHeader = ({ children, colSpan = 3, className = "" }: SectionHeaderProps) => (
  <tr>
    <td colSpan={colSpan} className={`font-bold rpfaas-table-header ${className}`}>
      {children}
    </td>
  </tr>
);

const MUNICIPALITY_MAP: Record<string, string> = { paracelis: 'paracellis' };

const FaasFooter = ({ amountInWords, taxStatus, locationMunicipality, effectivityOfAssessment, appraisedById, memoranda, className }: { amountInWords: string; taxStatus?: string; locationMunicipality?: string; effectivityOfAssessment?: string; appraisedById?: string; memoranda?: string; className?: string }) => {
  const [provincialAssessorName, setProvincialAssessorName] = useState('');
  const [municipalAssessorName, setMunicipalAssessorName] = useState('');
  const [appraisedByName, setAppraisedByName] = useState('');
  const [appraisedByPosition, setAppraisedByPosition] = useState('');

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

  useEffect(() => {
    if (!appraisedById) return;
    fetch(`/api/users/by-role?role=tax_mapper&id=${appraisedById}`)
      .then(res => res.json())
      .then(data => {
        const user = data.users?.[0];
        if (user) {
          setAppraisedByName(user.full_name || '');
          setAppraisedByPosition(user.position || '');
        }
      });
  }, [appraisedById]);

  return (
    <div className={className}>
        <div className="w-full flex gap-4">
            <div>Amount in Words:</div>
            <div className="uppercase border-b border-black">{amountInWords ? `${amountInWords} Pesos Only` : '—'}</div>
        </div>
        <div className="grid grid-cols-4 items-center mt-4 print:mt-1">
          <label className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center justify-center w-4 h-4 border border-black">
              {taxStatus !== 'exempt' ? 'x' : ''}
            </span>
            <span>Taxable</span>
          </label>

          <label className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center justify-center w-4 h-4 border border-black">
              {taxStatus === 'exempt' ? 'x' : ''}
            </span>
            <span>Exempt</span>
          </label>

          <div className="text-center">Effectivity of Assessment:</div>
          <div className="font-bold text-center">{effectivityOfAssessment ? effectivityOfAssessment.substring(0, 4) : ''}</div>
        </div>
        <div className="grid grid-cols-3 mt-6 print:mt-2">
            <div>Assessed/Appraised by:</div>
            <div>Recomending Approval:</div>
            <div>Approved by:</div>
        </div>
        <div className="grid grid-cols-3 text-center mt-12 print:mt-6">
            <div>
                <span className="inline-block border-b border-black w-3/4 mx-auto font-bold">{appraisedByName || ''}</span>
            </div>
            <div>
                <span className="inline-block border-b border-black w-3/4 mx-auto font-bold">{municipalAssessorName || 'Name of Municipal Assessor'}</span>
            </div>
            <div>
                <span className="inline-block border-b border-black w-3/4 mx-auto font-bold">{provincialAssessorName || 'Name of Provincial Assessor'}</span>
            </div>
        </div>
        <div className="grid grid-cols-3 text-center">
            <div>{appraisedByPosition || ''}</div>
            <div>Municipal Assessor</div>
            <div>Provincial Assessor</div>
        </div>
        <div className="mt-8 print:mt-2">
            <table style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                    <col style={{ width: '16.66%' }} />
                    <col style={{ width: '16.66%' }} />
                    <col style={{ width: '16.66%' }} />
                    <col style={{ width: '16.66%' }} />
                    <col style={{ width: '16.66%' }} />
                    <col style={{ width: '16.7%' }} />
                </colgroup>
                <tbody>
                <SectionHeader colSpan={6}>Memoranda:</SectionHeader>
                    <tr>
                        <td colSpan={6} style={{ minHeight: '1.5rem', paddingLeft: 4 }}>{memoranda || ''}</td>
                    </tr>
                    <tr>
                        <td>Prev. TD:</td>
                        <td></td>
                        <td>Prev. AV:</td>
                        <td></td>
                        <td>Prev. Area</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>Prev. Owner:</td>
                        <td></td>
                        <td>Prev. MV:</td>
                        <td></td>
                        <td>Effectivity of Assessment:</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    );
};

export default FaasFooter;
