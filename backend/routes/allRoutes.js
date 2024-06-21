const express = require('express');
const axios = require('axios');
const { TransactionModel } = require('../model/dataModel');

const getRoutes = express.Router();

getRoutes.get("/initialize", async (req, res) => {
    try {
        const response = await axios.get("https://s3.amazonaws.com/roxiler.com/product_transaction.json");
        const transactions = response.data;

        // Seed database with fetched data
        await TransactionModel.insertMany(transactions);

        res.status(200).send({ msg: 'Database initialized and seeded successfully', transactions: transactions });
    } catch (error) {
        console.error('Error initializing database:', error);
        res.status(500).send({ error: "Internal server error" });
    }
});

getRoutes.get("/alltransactions", async (req, res) => {
    try {
        const { search = '', page = 1, per_page = 10 } = req.query;

        const pageNumber = parseInt(page) || 1;
        const perPage = parseInt(per_page) || 10;

     
        const query = {};

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            const searchConditions = [
                { title: searchRegex },
                { description: searchRegex }
            ];

            const searchNumber = parseFloat(search);
            if (!isNaN(searchNumber)) {
                searchConditions.push({ price: searchNumber });
            }

            query.$or = searchConditions;
        }

    
        const transactions = await TransactionModel.find(query)
            .skip((pageNumber - 1) * perPage)
            .limit(perPage);

       
        const total = await TransactionModel.countDocuments(query);
        if (transactions.length === 0) {
            return res.status(200).send({
                'msg': 'No transactions found for the given query.',
            });
        }

        
        res.status(200).send({
            'page': pageNumber,
            'per_page': perPage,
            'total':total,
            'total_pages': Math.ceil(total / perPage),
            'data':transactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).send({ error: "Internal server error" });
    }
});



getRoutes.get("/statistics", async (req, res) => {
    try {
        const { month } = req.query;

       
        if (!month) {
            return res.status(400).send({ error: "Month is required." });
        }

        const monthInt = parseInt(month, 10);

        if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
            return res.status(400).send({ error: "Invalid month." });
        }

        const transactions = await TransactionModel.find();
        const filteredTransactions = transactions.filter(transaction => {
            let date = new Date(transaction.dateOfSale);
            let transactionMonth = date.getMonth() + 1;
            return transactionMonth === monthInt;
        });

        
        if (filteredTransactions.length === 0) {
            return res.status(404).send({ error: "No data found for this month." });
        }


        //  Total sale amount of selected month
        const totalSaleAmount = filteredTransactions.reduce((sum, transaction) => sum + (transaction.sold ? transaction.price : 0), 0);

        //  Total number of sold items of selected month
        const totalSoldItems = filteredTransactions.filter(transaction => transaction.sold).length;

        // Total number of not sold items of selected month
        const totalUnsoldItems = filteredTransactions.filter(transaction => !transaction.sold).length;

        res.status(200).send({
            "totalSaleAmount": totalSaleAmount,
            "totalSoldItems": totalSoldItems,
            "totalUnsoldItems": totalUnsoldItems
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
      
    }
});

getRoutes.get("/barchart", async (req, res) => {
    try {
        const { month } = req.query;

        
        if (!month) {
            return res.status(400).send({ error: "Month is required." });
        }

        const monthInt = parseInt(month, 10);

        if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
            return res.status(400).send({ error: "Invalid month." });
        }

    
        const transactions = await TransactionModel.find();

       
        const filteredTransactions = transactions.filter(transaction => {
            let date = new Date(transaction.dateOfSale);
            let transactionMonth = date.getMonth() + 1;
            return transactionMonth === monthInt;
        });

      
        if (filteredTransactions.length === 0) {
            return res.status(404).send({ error: "No data found for this month." });
        }

        
        const priceRanges = {
            '0-100': 0,
            '101-200': 0,
            '201-300': 0,
            '301-400': 0,
            '401-500': 0,
            '501-600': 0,
            '601-700': 0,
            '701-800': 0,
            '801-900': 0,
            '901-above': 0
        };

        // Count the number of items in each price range
        filteredTransactions.forEach(transaction => {
            if (transaction.price <= 100) {
                priceRanges['0-100']++;
            } else if (transaction.price <= 200) {
                priceRanges['101-200']++;
            } else if (transaction.price <= 300) {
                priceRanges['201-300']++;
            } else if (transaction.price <= 400) {
                priceRanges['301-400']++;
            } else if (transaction.price <= 500) {
                priceRanges['401-500']++;
            } else if (transaction.price <= 600) {
                priceRanges['501-600']++;
            } else if (transaction.price <= 700) {
                priceRanges['601-700']++;
            } else if (transaction.price <= 800) {
                priceRanges['701-800']++;
            } else if (transaction.price <= 900) {
                priceRanges['801-900']++;
            } else {
                priceRanges['901-above']++;
            }
        });

        console.log(priceRanges);
        res.status(200).send(priceRanges);
    } catch (error) {
        console.error('Error fetching price range statistics:', error);
        res.status(500).send({ error: "Internal server error" });
    }
});


getRoutes.get("/piechart", async (req, res) => {
    try {
        const { month } = req.query;

        
        if (!month) {
            return res.status(400).send({ error: "Month is required." });
        }

        const monthInt = parseInt(month, 10);

        if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
            return res.status(400).send({ error: "Invalid month." });
        }

   
        const transactions = await TransactionModel.find();


        const filteredTransactions = transactions.filter(transaction => {
            let date = new Date(transaction.dateOfSale);
            let transactionMonth = date.getMonth() + 1;
            return transactionMonth === monthInt;
        });


        if (filteredTransactions.length === 0) {
            return res.status(404).send({ error: "No data found for this month." });
        }

        
        const categoryCounts = {};

        // Count the number of items in each category
        filteredTransactions.forEach(transaction => {
            const category = transaction.category;
            if (categoryCounts[category]) {
                categoryCounts[category]++;
            } else {
                categoryCounts[category] = 1;
            }
        });

        
        const response = Object.keys(categoryCounts).map(category => ({
            category: category,
            count: categoryCounts[category]
        }));

        console.log(response);

        
        res.status(200).send(response);
    } catch (error) {
        console.error('Error fetching category statistics:', error);
        res.status(500).send({ error: "Internal server error" });
    }
});



const fetchDataForMonth = async (endpoint, month) => {
    try {
        const transactions = await TransactionModel.find();
        const response = await axios.get(`/${endpoint}?month=${month}`);
        return {
            transactions: transactions,
            externalData: response.data
        };
    } catch (error) {
        console.error(`Error fetching ${endpoint} data for month ${month}:`, error.message);
        throw error; // Ensure the error is propagated correctly
    }
};


// getRoutes.get("/combined", async (req, res) => {
//     try {
//         const { month } = req.query;
//         const monthInt = parseInt(month, 10);

//         if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
//             return res.status(400).send({ error: "Invalid month." });
//         }

//         const apiRequests = [
//             fetchDataForMonth('statistics', monthInt),
//             fetchDataForMonth('barchart', monthInt),
//             fetchDataForMonth('piechart', monthInt)
//         ];

//         const [statisticsData, barchartData, piechartData] = await Promise.all(apiRequests);

//         const combinedResponse = {
//             statistics: {
//                 transactions: statisticsData.transactions,
//                 externalData: statisticsData.externalData
//             },
//             barchart: {
//                 transactions: barchartData.transactions,
//                 externalData: barchartData.externalData
//             },
//             piechart: {
//                 transactions: piechartData.transactions,
//                 externalData: piechartData.externalData
//             }
//         };

//         res.status(200).json(combinedResponse);
//     } catch (error) {
//         console.error('Error fetching combined data:', error.message);

//         if (axios.isAxiosError(error)) {
//             console.error('Axios error details:', error.toJSON());
//         }

//         res.status(500).send({ error: "Internal server error" });
//     }
// });



module.exports = getRoutes;
