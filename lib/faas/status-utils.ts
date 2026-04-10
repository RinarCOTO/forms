export function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'approved':              return 'success' as const;
    case 'submitted':             return 'warning' as const;
    case 'municipal_signed':      return 'warning' as const;
    case 'laoo_approved':         return 'warning' as const;
    case 'returned':              return 'destructive' as const;
    case 'returned_to_municipal': return 'destructive' as const;
    case 'draft':                 return 'secondary' as const;
    default:                      return 'default' as const;
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'under_review':          return 'Under Review';
    case 'returned':              return 'Returned';
    case 'returned_to_municipal': return 'Returned to Municipal';
    case 'submitted':             return 'Submitted';
    case 'municipal_signed':      return 'Municipal Signed';
    case 'laoo_approved':         return 'LAOO Approved';
    case 'approved':              return 'Approved';
    case 'draft':                 return 'Draft';
    default:                      return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  }
}
