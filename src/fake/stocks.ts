import { Request, Response } from 'express'

enum Model {
  iPhone13Mini = "iPhone13-mini-256gb",
  iPhone13 = "iPhone13-512gb",
  iPhone13Pro = "iPhone13-Pro-512gb",
  iPhone13ProMax = "iPhone13-ProMax-512gb",
}

const stockDB = {
  [Model.iPhone13Mini]: {
    "name": "iPhone13 Mini 256GB",
    "stock": 3000,
    "rrp": 3899,
    "promoPrice": 2188
  }, 
  [Model.iPhone13]: {
    "name": "iPhone13 512GB",
    "stock": 8000,
    "rrp": 5299,
    "promoPrice": 3458
  },
  [Model.iPhone13Pro]: {
    "name": "iPhone13 Pro 1TB",
    "stock": 5000,
    "rrp": 7199,
    "promoPrice": 5148
  },
  [Model.iPhone13ProMax]: {
    "name": "iPhone13 Pro Max 1TB",
    "stock": 2000,
    "rrp": 7599,
    "promoPrice": 5448
  }
}

const getStockAvailabilityByModel = (model: Model) => {
  const randomSeed = new Date().getTime();
  const stockInfo = stockDB[model];
  const remainingStock = (randomSeed % stockInfo.stock);
  return {
    ...stockInfo,
    remainingStock
  }
}

export const getStockAvailability = async(
  _: Request,
  res: Response,
  ) => {
  try {
    res.json({
      data:[ 
        getStockAvailabilityByModel(Model.iPhone13Mini),
        getStockAvailabilityByModel(Model.iPhone13),
        getStockAvailabilityByModel(Model.iPhone13Pro),
        getStockAvailabilityByModel(Model.iPhone13ProMax)
      ]
    });
  } catch(e) {
    console.log(e);
    res.status(500).json({error: e});
  }
}