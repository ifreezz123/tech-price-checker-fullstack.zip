function randomPriceShift(price) {
  const shift = 1 + ((Math.random() - 0.5) * 0.04);
  return Math.max(1, Number((price * shift).toFixed(2)));
}

async function fetchLatestPrices(existingProducts) {
  return existingProducts.map(product => ({
    external_id: product.external_id,
    price: randomPriceShift(product.price),
    url: product.url,
    store: product.store
  }));
}

module.exports = { fetchLatestPrices };
