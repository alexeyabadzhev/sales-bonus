/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const discount = 1 - (purchase.discount / 100);
   return purchase.sale_price * purchase.quantity * discount;
};

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

    if (index === 0) {
        return profit * 0.15;
    }
    if (index === 1 || index === 2) {
        return profit * 0.1;
    }
    if (index === 3) {
        return profit * 0.05;
    }
    return 0;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
    ) {
        throw new Error('Входящие данные не верны!')
    };
    if (!data.sellers.length
        || !data.products.length
        || !data.purchase_records.length
    ) {
        throw new Error('Входящие данные пустые!')
    };

    // @TODO: Проверка наличия опций
    const { calculateBonus, calculateRevenue } = options;
    if (!calculateBonus || !calculateRevenue) {
        throw new Error('Не достаточно обработчиков!')
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const middleStatistic = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerObject = Object.fromEntries(middleStatistic.map(seller => [seller.id, seller]));
    const productObject = Object.fromEntries(data.products.map(product => [product.sku, product]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(item => {
        const seller = sellerObject[item.seller_id];
        seller.sales_count += 1;
        seller.revenue += item.total_amount;

        let totalCost = 0;
        let totalRevenue = 0;

        item.items.forEach(item => {
            const product = productObject[item.sku];
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item, product);
            const profit = revenue - cost;

            totalCost += cost;
            totalRevenue += revenue;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }

            seller.products_sold[item.sku] += item.quantity;
        });

        seller.profit += totalRevenue - totalCost;
    });

    // @TODO: Сортировка продавцов по прибыли
    middleStatistic.sort((a,b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    const total = middleStatistic.length;
    middleStatistic.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, total, seller);

        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({sku, quantity}))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return middleStatistic.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}
