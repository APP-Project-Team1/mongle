import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const VendorContext = createContext();

export function useVendors() {
  return useContext(VendorContext);
}

export function VendorProvider({ children }) {
  const [vendors, setVendors] = useState([]);
  const [vendorCategories, setVendorCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, category, project_id')
        .order('category', { ascending: true });

      if (error) throw error;

      const transformedVendors = data?.map((vendor, index) => ({
        id: vendor.id,
        type: vendor.category || '기타',
        name: vendor.name || '업체명 없음',
        status: '등록됨',
        statusColor: `var(--stage-${(index % 4) + 1}-color)`,
      })) || [];

      setVendors(transformedVendors);

      const categories = [...new Set(transformedVendors.map((v) => v.type))];
      setVendorCategories(categories);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
      setVendorCategories([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <VendorContext.Provider value={{ vendors, vendorCategories, loading, refetchVendors: fetchVendors }}>
      {children}
    </VendorContext.Provider>
  );
}
