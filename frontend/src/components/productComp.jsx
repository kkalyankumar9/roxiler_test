import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Chart from 'react-apexcharts';

const ProductsComp = () => {
  const [selectedMonth, setSelectedMonth] = useState(3); // Default to March
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statistics, setStatistics] = useState(null);
  const [barChartData, setBarChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions(searchTerm, page, selectedMonth);
    fetchCombinedStatistics(selectedMonth);
  }, [selectedMonth, searchTerm, page]);

  const fetchTransactions = async (search, page, selectedMonth) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://roxiler-test-server.onrender.com/get/alltransactions', {
        params: { search, page, per_page: 60, month: selectedMonth },
      });
      const filteredTransactions = response.data.data.filter(transaction => {
        const transactionMonth = new Date(transaction.dateOfSale).getMonth(); // Zero-indexed month
        return transactionMonth === selectedMonth - 1; // selectedMonth is 1-indexed, so adjust to zero-indexed
      });
  
      setTransactions(filteredTransactions);
      setTotalPages(Math.ceil(filteredTransactions.length / 10));

      console.log(response.data); // Log response data to check if transactions are coming correctly

      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCombinedStatistics = async (month) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://roxiler-test-server.onrender.com/get/combinedStatistics', {
        params: { month },
      });

      console.log('Statistics response:', response.data);

      // Transform priceRanges to an array of objects with `range` and `count`
      const priceRangesArray = Object.entries(response.data.priceRanges).map(([range, count]) => ({
        range,
        count,
      }));

      console.log('Transformed Bar Chart Data:', priceRangesArray);
      console.log('Pie Chart Data:', response.data.categoryCounts);

      setStatistics(response.data.statistics);
      setBarChartData(priceRangesArray);
      setPieChartData(response.data.categoryCounts);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = (e) => {
    const selectedMonthValue = parseInt(e.target.value, 10);
    setSelectedMonth(selectedMonthValue);
    setPage(1); // Reset to first page when month changes
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when search term changes
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const barChartOptions = {
    chart: {
      id: 'bar-chart',
    },
    xaxis: {
      categories: barChartData.map(item => item.range),
    },
  };

  const pieChartOptions = {
    labels: pieChartData.map(item => item.category),
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search transactions"
          value={searchTerm}
          onChange={handleSearchChange}
          className="border p-2 rounded w-full max-w-xs"
        />
        <select value={selectedMonth} onChange={handleMonthChange} className="border p-2 rounded ml-2">
          <option value="" disabled>Select a month</option>
          {[...Array(12).keys()].map((_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-center text-blue-500">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">Error: {error}</p>
      ) : (
        <div>
          <table className="table-auto w-full mb-4 border border-gray-200 rounded">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Title</th>
                <th>Image</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Date of Sale</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{transaction.title}</td>
                  <td  className="border px-4 py-2"><img src={transaction.image} alt="" /> </td>
                  <td className="border px-4 py-2">{transaction.description}</td>
                  <td className="border px-4 py-2">{transaction.price}</td>
                  <td className="border px-4 py-2">{new Date(transaction.dateOfSale).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center items-center">
            <button onClick={handlePreviousPage} disabled={page <= 1} className="bg-teal-500 text-white px-4 py-2 rounded disabled:bg-blue-300">
              Previous
            </button>
            <p className="mx-4">{page}</p>
            <button onClick={handleNextPage} disabled={page >= totalPages} className="bg-teal-500 text-white px-4 py-2 rounded disabled:bg-blue-300">
              Next
            </button>
          </div>
        </div>
      )}

      {statistics && (
        <div className="mb-4 p-4 border border-gray-200 rounded bg-gray-50">
          <h2 className="text-xl font-bold mb-2">Statistics for {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })}</h2>
          <p className="mb-1">Total Sale Amount: <span className="font-semibold">{statistics.totalSaleAmount}</span></p>
          <p className="mb-1">Total Sold Items: <span className="font-semibold">{statistics.totalSoldItems}</span></p>
          <p className="mb-1">Total Unsold Items: <span className="font-semibold">{statistics.totalUnsoldItems}</span></p>
        </div>
      )}

      {barChartData.length > 0 && (
        <div className="mb-4 p-4 border border-gray-200 rounded bg-gray-50">
          <h2 className="text-xl font-bold mb-2">Bar Chart</h2>
          <Chart
            options={barChartOptions}
            series={[{ name: 'Prices', data: barChartData.map(item => item.count) }]}
            type="bar"
            height="300"
          />
        </div>
      )}

      {pieChartData.length > 0 && (
        <div className="mb-4 p-4 border border-gray-200 rounded bg-gray-50">
          <h2 className="text-xl font-bold mb-2">Pie Chart</h2>
          <Chart
            options={pieChartOptions}
            series={pieChartData.map(item => item.count)}
            type="pie"
            height="300"
          />
        </div>
      )}
    </div>
  );
};

export default ProductsComp;
