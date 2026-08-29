import { supabase } from '../lib/supabase';

/**
 * Service de gestion des demandes de conteneurs.
 * Utilise uniquement Supabase — aucune donnée statique ni localStorage.
 * La table `demandes_conteneurs` doit exister dans Supabase (voir SQL ci-dessous).
 */

export const containerRequestsService = {

  /**
   * Récupère toutes les demandes (admin = toutes, commune = filtrées par commune_id)
   * @param {{ commune_id?: string }} filters
   */
  async getAllRequests(filters = {}) {
    let query = supabase
      .from('demandes_conteneurs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.commune_id) {
      query = query.eq('commune_id', filters.commune_id);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erreur lecture demandes_conteneurs:', error.message);
      throw new Error(error.message);
    }
    return data || [];
  },

  /**
   * Crée une nouvelle demande de conteneur
   * @param {object} newReq
   */
  async createRequest(newReq) {
    const { data, error } = await supabase
      .from('demandes_conteneurs')
      .insert([{
        statut: 'en_attente',
        devis_montant: null,
        reponse_admin: null,
        ...newReq,
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur création demande_conteneur:', error.message);
      throw new Error(error.message);
    }
    return data;
  },

  /**
   * Met à jour le statut + réponse admin + devis d'une demande
   * @param {string} id
   * @param {string} newStatus
   * @param {string|null} adminNote
   * @param {string|null} devisMontant
   */
  async updateStatus(id, newStatus, adminNote = null, devisMontant = null) {
    const payload = {
      statut: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (adminNote !== null) payload.reponse_admin = adminNote;
    if (devisMontant !== null) payload.devis_montant = devisMontant;

    const { data, error } = await supabase
      .from('demandes_conteneurs')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour demande_conteneur:', error.message);
      throw new Error(error.message);
    }
    return data;
  },

  /**
   * Supprime une demande
   * @param {string} id
   */
  async deleteRequest(id) {
    const { error } = await supabase
      .from('demandes_conteneurs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression demande_conteneur:', error.message);
      throw new Error(error.message);
    }
  },
};
