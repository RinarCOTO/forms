"use client";

import { useEffect, useState } from "react";
// import Image from "next/image"; // preserved for signature feature


const MUNICIPALITY_MAP: Record<string, string> = { paracelis: 'paracellis' };

const ROLE_LABELS: Record<string, string> = {
  municipal_tax_mapper:                    'Tax Mapper',
  municipal_assessor:          'Municipal Tax Mapper',
  laoo:                          'LAOO',
  provincial_assessor:           'Provincial Assessor',
  assistant_provincial_assessor: 'Asst. Provincial Assessor',
  admin:                         'Admin',
  super_admin:                   'Super Admin',
};

type Props = {
  amountInWords: string;
  taxStatus?: string;
  locationMunicipality?: string;
  effectivityOfAssessment?: string;
  memoranda?: string;
  className?: string;
  appraisedById?: string;
  municipalReviewerId?: string;
  provincialReviewerId?: string;
  previousTdNo?: string;
  previousOwner?: string;
  previousAv?: string | number;
  previousMv?: string | number;
  previousArea?: string | number;
};

const FaasFooter = ({
  amountInWords,
  taxStatus,
  locationMunicipality,
  effectivityOfAssessment,
  appraisedById,
  memoranda,
  className,
  municipalReviewerId,
  previousTdNo,
  previousOwner,
  previousAv,
  previousMv,
  previousArea,
}: Props) => {
  const fmtMoney = (v: string | number | undefined) => {
    if (v == null || v === '') return '';
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (isNaN(n)) return '';
    return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const fmtNum = (v: string | number | undefined) => {
    if (v == null || v === '') return '';
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return isNaN(n) ? '' : n.toLocaleString('en-PH');
  };
  const [provincialAssessorName, setProvincialAssessorName] = useState('');
  const [municipalAssessorName, setMunicipalAssessorName] = useState('');
  const [municipalAssessorPosition, setMunicipalAssessorPosition] = useState('');
  const [appraisedByName, setAppraisedByName] = useState('');
  const [appraisedByPosition, setAppraisedByPosition] = useState('');
  const [appraisedByRole, setAppraisedByRole] = useState('');

  // Signatures hidden — preserved for future use
  // const [taxMapperSignatureUrl, setTaxMapperSignatureUrl] = useState<string | null>(null);
  // const [municipalSignatureUrl, setMunicipalSignatureUrl] = useState<string | null>(null);
  // const [provincialSignatureUrl, setProvincialSignatureUrl] = useState<string | null>(null);

  // Provincial assessor name — fetched by role
  useEffect(() => {
    fetch('/api/users/by-role?role=provincial_assessor')
      .then(res => res.json())
      .then(data => { if (data.users?.[0]?.full_name) setProvincialAssessorName(data.users[0].full_name); });
  }, []);

  // Municipal assessor name — use reviewer ID if available, else look up by municipality
  useEffect(() => {
    if (municipalReviewerId) {
      fetch(`/api/users/by-role?id=${municipalReviewerId}`)
        .then(res => res.json())
        .then(data => {
          const user = data.users?.[0];
          if (user) {
            setMunicipalAssessorName(user.full_name || '');
            setMunicipalAssessorPosition(user.position || '');
          }
        });
      return;
    }
    if (!locationMunicipality) return;
    const normalized = locationMunicipality.toLowerCase();
    const municipality = MUNICIPALITY_MAP[normalized] ?? normalized;
    fetch(`/api/users/by-role?role=municipal_assessor&municipality=${municipality}`)
      .then(res => res.json())
      .then(data => {
        const user = data.users?.[0];
        if (user) {
          setMunicipalAssessorName(user.full_name || '');
          setMunicipalAssessorPosition(user.position || '');
        }
      });
  }, [municipalReviewerId, locationMunicipality]);

  // Appraised by name — use reviewer ID if set, else fall back to municipal_tax_mapper for municipality
  useEffect(() => {
    if (appraisedById) {
      fetch(`/api/users/by-role?id=${appraisedById}`)
        .then(res => res.json())
        .then(data => {
          const user = data.users?.[0];
          if (user) {
            setAppraisedByName(user.full_name || '');
            setAppraisedByPosition(user.position || '');
            setAppraisedByRole(user.role || '');
          }
        });
      return;
    }
    if (!locationMunicipality) return;
    const normalized = locationMunicipality.toLowerCase();
    const municipality = MUNICIPALITY_MAP[normalized] ?? normalized;
    fetch(`/api/users/by-role?role=municipal_tax_mapper&municipality=${municipality}`)
      .then(res => res.json())
      .then(data => {
        const user = data.users?.[0];
        if (user) {
          setAppraisedByName(user.full_name || '');
          setAppraisedByPosition(user.position || '');
          setAppraisedByRole(user.role || '');
        }
      });
  }, [appraisedById, locationMunicipality]);

  // Signature images — hidden, preserved for future use
  // useEffect(() => {
  //   if (!appraisedById) return;
  //   fetch(`/api/users/${appraisedById}/signature`)
  //     .then(res => res.json())
  //     .then(data => { if (data.success && data.data?.signedUrl) setTaxMapperSignatureUrl(data.data.signedUrl); });
  // }, [appraisedById]);

  // useEffect(() => {
  //   if (!municipalReviewerId) return;
  //   fetch(`/api/users/${municipalReviewerId}/signature`)
  //     .then(res => res.json())
  //     .then(data => { if (data.success && data.data?.signedUrl) setMunicipalSignatureUrl(data.data.signedUrl); });
  // }, [municipalReviewerId]);

  // useEffect(() => {
  //   if (!provincialReviewerId) return;
  //   fetch(`/api/users/${provincialReviewerId}/signature`)
  //     .then(res => res.json())
  //     .then(data => { if (data.success && data.data?.signedUrl) setProvincialSignatureUrl(data.data.signedUrl); });
  // }, [provincialReviewerId]);

  return (
    <div className={className}>
      <div className="w-full flex gap-4">
        <div>Amount in Words:</div>
        <div className="uppercase underline" style={{ minWidth: "75%" }}>{amountInWords ? `${amountInWords} Pesos Only` : '—'}</div>
      </div>

      <div className="grid grid-cols-4 items-center mt-4 print:mt-0">
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
        <div className="font-bold text-center">{effectivityOfAssessment ? String(effectivityOfAssessment).substring(0, 4) : ''}</div>
      </div>

      <div className="grid grid-cols-3 mt-6 print:mt-1">
        <div>Assessed/Appraised by:</div>
        <div>Recommending Approval:</div>
        <div>Approved by:</div>
      </div>

      {/* Signature images — hidden, preserved for future use */}
      <div className="grid grid-cols-3 text-center mt-2 print:mt-1">
        <div className="flex flex-col items-center">
          {/* <Image src={taxMapperSignatureUrl} alt="Tax Mapper signature" width={160} height={48} className="object-contain max-h-12 mb-0.5 print:max-h-10" /> */}
          <div className="h-12 print:h-6" />
          <span className="inline-block border-b border-black w-3/4 mx-auto font-bold capitalize">{appraisedByName || ''}</span>
        </div>
        <div className="flex flex-col items-center">
          {/* <Image src={municipalSignatureUrl} alt="Municipal Assessor signature" width={160} height={48} className="object-contain max-h-12 mb-0.5 print:max-h-10" /> */}
          <div className="h-12 print:h-6" />
          <span className="inline-block border-b border-black w-3/4 mx-auto font-bold capitalize">{municipalAssessorName || 'Name of Municipal Assessor'}</span>
        </div>
        <div className="flex flex-col items-center">
          {/* <Image src={provincialSignatureUrl} alt="Provincial Assessor signature" width={160} height={48} className="object-contain max-h-12 mb-0.5 print:max-h-10" /> */}
          <div className="h-12 print:h-6" />
          <span className="inline-block border-b border-black w-3/4 mx-auto font-bold capitalize">{provincialAssessorName || 'Name of Provincial Assessor'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 text-center">
        <div>{appraisedByPosition || ''}</div>
        <div>{municipalAssessorPosition || ''}</div>
        <div></div>
      </div>
      <div className="grid grid-cols-3 text-center">
        <div>{appraisedByRole ? ROLE_LABELS[appraisedByRole] ?? appraisedByRole : ''}</div>
        <div>Municipal Assessor</div>
        <div>Provincial Assessor</div>
      </div>

      <div className="mt-8 print:mt-1">
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
            <tr>
              <td className="font-bold rpfaas-table-header whitespace-nowrap" style={{ borderRight: 'none' }}>Memoranda:</td>
              <td colSpan={5} style={{ minHeight: '1.5rem', borderLeft: 'none' }}>{memoranda || ''}</td>
            </tr>
            <tr>
              <td>Prev. TD:</td><td className="font-bold">{previousTdNo || ''}</td>
              <td>Prev. AV:</td><td className="font-bold">{fmtMoney(previousAv)}</td>
              <td>Prev. Area</td><td className="font-bold">{fmtNum(previousArea)}</td>
            </tr>
            <tr>
              <td>Prev. Owner:</td><td className="font-bold uppercase">{previousOwner || ''}</td>
              <td>Prev. MV:</td><td className="font-bold">{fmtMoney(previousMv)}</td>
              <td>Effectivity of Assessment:</td>
              <td className="font-bold">{effectivityOfAssessment ? String(effectivityOfAssessment).substring(0, 4) : ''}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FaasFooter;
