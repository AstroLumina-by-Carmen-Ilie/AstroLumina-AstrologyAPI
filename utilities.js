export const calculateSouthNode = (northNodeSign, northNodeHouse) => {
    const signs = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    const houses = ['House 1', 'House 2', 'House 3', 'House 4', 'House 5', 'House 6',
        'House 7', 'House 8', 'House 9', 'House 10', 'House 11', 'House 12'];

    const northNodeSignIndex = signs.indexOf(northNodeSign);
    const northNodeHouseIndex = houses.indexOf(northNodeHouse);

    return {
        name: 'South Node',
        sign: signs[(northNodeSignIndex + 6) % 12],
        house: houses[(northNodeHouseIndex + 6) % 12]
    };
};

