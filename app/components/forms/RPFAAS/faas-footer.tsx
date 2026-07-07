"use client";

import { useEffect, useState } from "react";
import { MemorandaText } from "./components";
// import Image from "next/image"; // preserved for signature feature


const MUNICIPALITY_MAP: Record<string, string> = { paracelis: 'paracellis' };

const ROLE_LABELS: Record<string, string> = {
  municipal_tax_mapper:                    'Municipal Tax Mapper',
  municipal_assessor:                      'Municipal Assessor',
  laoo:                                    'LAOO',
  provincial_assessor:                     'Provincial Assessor',
  assistant_provincial_assessor:           'Asst. Provincial Assessor',
  admin:                                   'Admin',
  super_admin:                             'Super Admin',
};

type UserLookup = {
  full_name?: string | null;
  position?: string | null;
  role?: string | null;
};

const firstUserFromLookup = async (url: string): Promise<UserLookup | undefined> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return undefined;
  const data = await res.json();
  return data.users?.[0];
};

type Props = {
  amountInWords: string;
  taxStatus?: string;
  locationMunicipality?: string;
  effectivityOfAssessment?: string;
  memoranda?: string;
  className?: string;
  appraisedById?: string;
  submittedAt?: string;
  municipalSignedAt?: string;
  provincialSignedAt?: string;
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
  submittedAt,
  municipalSignedAt,
  provincialSignedAt,
  memoranda,
  className,
  municipalReviewerId,
  provincialReviewerId,
  previousTdNo,
  previousOwner,
  previousAv,
  previousMv,
  previousArea,
}: Props) => {
  const fmtDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  };
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
  const [provincialLookupReady, setProvincialLookupReady] = useState(false);
  const [municipalLookupReady, setMunicipalLookupReady] = useState(false);
  const [appraisedByLookupReady, setAppraisedByLookupReady] = useState(false);
  const footerLookupReady = provincialLookupReady && municipalLookupReady && appraisedByLookupReady;

  // Signatures hidden — preserved for future use
  // const [taxMapperSignatureUrl, setTaxMapperSignatureUrl] = useState<string | null>(null);
  // const [municipalSignatureUrl, setMunicipalSignatureUrl] = useState<string | null>(null);
  // const [provincialSignatureUrl, setProvincialSignatureUrl] = useState<string | null>(null);

  // Provincial assessor name — use reviewer ID if available, else fetch by role.
  useEffect(() => {
    let cancelled = false;
    setProvincialLookupReady(false);
    setProvincialAssessorName('');

    const url = provincialReviewerId
      ? `/api/users/by-role?id=${encodeURIComponent(provincialReviewerId)}`
      : '/api/users/by-role?role=provincial_assessor';

    firstUserFromLookup(url)
      .then(user => {
        if (!cancelled && user) {
          setProvincialAssessorName(user.full_name || '');
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProvincialLookupReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [provincialReviewerId]);

  // Municipal assessor name — use reviewer ID if available, else look up by municipality
  useEffect(() => {
    let cancelled = false;
    setMunicipalLookupReady(false);
    setMunicipalAssessorName('');
    setMunicipalAssessorPosition('');

    if (municipalReviewerId) {
      firstUserFromLookup(`/api/users/by-role?id=${encodeURIComponent(municipalReviewerId)}`)
        .then(user => {
          if (!cancelled && user) {
            setMunicipalAssessorName(user.full_name || '');
            setMunicipalAssessorPosition(user.position || '');
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setMunicipalLookupReady(true);
        });
      return () => {
        cancelled = true;
      };
    }

    if (!locationMunicipality) {
      setMunicipalLookupReady(true);
      return;
    }

    const normalized = locationMunicipality.toLowerCase();
    const municipality = MUNICIPALITY_MAP[normalized] ?? normalized;
    firstUserFromLookup(`/api/users/by-role?role=municipal_assessor&municipality=${encodeURIComponent(municipality)}`)
      .then(user => {
        if (!cancelled && user) {
          setMunicipalAssessorName(user.full_name || '');
          setMunicipalAssessorPosition(user.position || '');
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setMunicipalLookupReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [municipalReviewerId, locationMunicipality]);

  // Appraised by name — use reviewer ID if set, else fall back to municipal_tax_mapper for municipality
  useEffect(() => {
    let cancelled = false;
    setAppraisedByLookupReady(false);
    setAppraisedByName('');
    setAppraisedByPosition('');
    setAppraisedByRole('');

    if (appraisedById) {
      firstUserFromLookup(`/api/users/by-role?id=${encodeURIComponent(appraisedById)}`)
        .then(user => {
          if (!cancelled && user) {
            setAppraisedByName(user.full_name || '');
            setAppraisedByPosition(user.position || '');
            setAppraisedByRole(user.role || '');
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setAppraisedByLookupReady(true);
        });
      return () => {
        cancelled = true;
      };
    }

    if (!locationMunicipality) {
      setAppraisedByLookupReady(true);
      return;
    }

    const normalized = locationMunicipality.toLowerCase();
    const municipality = MUNICIPALITY_MAP[normalized] ?? normalized;
    firstUserFromLookup(`/api/users/by-role?role=municipal_tax_mapper&municipality=${encodeURIComponent(municipality)}`)
      .then(user => {
        if (!cancelled && user) {
          setAppraisedByName(user.full_name || '');
          setAppraisedByPosition(user.position || '');
          setAppraisedByRole(user.role || '');
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAppraisedByLookupReady(true);
      });

    return () => {
      cancelled = true;
    };
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
    <div className={className} data-faas-footer-ready={footerLookupReady ? "true" : "false"}>
      <div className="w-full flex gap-4">
        <div>Amount in Words:</div>
        <div className="uppercase underline" style={{ minWidth: "75%" }}>{amountInWords ? `${amountInWords} Pesos Only` : '—'}</div>
      </div>

      <div className="grid grid-cols-4 items-center mt-4 print:mt-2">
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
      <div className="grid grid-cols-3 text-center text-[11px] print:text-[9px] leading-tight mt-0.5">
        <div>{fmtDate(submittedAt)}</div>
        <div>{fmtDate(municipalSignedAt)}</div>
        <div>{fmtDate(provincialSignedAt)}</div>
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
            <tr data-field="memoranda">
              <td className="font-bold rpfaas-table-header whitespace-nowrap" style={{ borderRight: 'none' }}>Memoranda:</td>
              <td colSpan={5} className="whitespace-pre-line" style={{ minHeight: '1.5rem', borderLeft: 'none' }}><MemorandaText value={memoranda} /></td>
            </tr>
            <tr data-field="previous_td_no previous_av previous_area">
              <td>Prev. TD:</td><td className="font-bold">{previousTdNo || ''}</td>
              <td>Prev. AV:</td><td className="font-bold">{fmtMoney(previousAv)}</td>
              <td>Prev. Area</td><td className="font-bold">{fmtNum(previousArea)}</td>
            </tr>
            <tr data-field="previous_owner previous_mv effectivity_of_assessment">
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
