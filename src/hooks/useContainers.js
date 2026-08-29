import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useContainers() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchContainers() {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('containers_with_coords')
          .select('id, nom, latitude, longitude, statut, capacite');

        if (fetchError) throw fetchError;
        
        // Filter out containers with null latitude or longitude
        const validContainers = (data || []).filter(
          c => c.latitude !== null && c.longitude !== null
        );
        
        setContainers(validContainers);
      } catch (err) {
        console.error('[useContainers] Error fetching containers:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchContainers();
  }, []);

  return { containers, loading, error };
}
