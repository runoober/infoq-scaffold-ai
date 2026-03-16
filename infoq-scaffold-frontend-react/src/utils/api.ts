type TableResponseLike<T> = {
  rows?: T[];
  total?: number;
  data?: T[] | T | null;
};

export const resolveRows = <T>(response: TableResponseLike<T> | undefined | null): T[] => {
  if (Array.isArray(response?.rows)) {
    return response.rows;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  return [];
};

export const resolveTotal = <T>(response: TableResponseLike<T> | undefined | null): number => {
  if (typeof response?.total === 'number') {
    return response.total;
  }
  return resolveRows(response).length;
};

export const resolveData = <T>(response: { data?: T | null } | undefined | null, fallback: T): T => {
  if (response && typeof response === 'object' && response.data !== undefined && response.data !== null) {
    return response.data;
  }
  return fallback;
};

export const resolveArrayData = <T>(response: { data?: T[] | null } | undefined | null): T[] => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  return [];
};
