const supabase = require('../utils/supabase');

/**
 * Service to handle interpretation-related operations with Supabase
 */
class InterpretationService {
  /**
   * Get a specific interpretation from Supabase
   * @param {string} lang - Language code (en, ro)
   * @param {string} planet - Planet name
   * @param {string} sign - Zodiac sign
   * @param {string} house - House number (format: "House X")
   * @returns {Promise<string>} The interpretation text
   */
  async getInterpretation(lang, planet, sign, house) {
    const { data, error } = await supabase
      .from('interpretations')
      .select('interpretation')
      .eq('language', lang)
      .eq('planet', planet)
      .eq('sign', sign)
      .eq('house', house)
      .single();
    
    if (error) {
      console.error(`Error fetching interpretation for ${planet} in ${sign}, ${house}:`, error);
      return null;
    }
    
    return data?.interpretation || null;
  }

  /**
   * Get all interpretations for a specific language
   * @param {string} lang - Language code (en, ro)
   * @returns {Promise<Array>} Array of interpretation objects
   */
  async getAllInterpretations(lang) {
    const { data, error } = await supabase
      .from('interpretations')
      .select('*')
      .eq('language', lang);
    
    if (error) {
      console.error(`Error fetching all interpretations for ${lang}:`, error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Update an interpretation
   * @param {string} lang - Language code (en, ro)
   * @param {string} planet - Planet name
   * @param {string} sign - Zodiac sign
   * @param {string} house - House number (format: "House X")
   * @param {string} interpretation - The new interpretation text
   * @returns {Promise<boolean>} Success status
   */
  async updateInterpretation(lang, planet, sign, house, interpretation) {
    const { error } = await supabase
      .from('interpretations')
      .upsert({
        language: lang,
        planet,
        sign,
        house,
        interpretation
      }, { onConflict: 'language,planet,sign,house' });
    
    if (error) {
      console.error(`Error updating interpretation for ${planet} in ${sign}, ${house}:`, error);
      return false;
    }
    
    return true;
  }
}

module.exports = new InterpretationService();
