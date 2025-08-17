import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import useApi from '../utils/api';
import { Footer } from './Footer';

export default function MonthlySummary() {
  const { user } = useAuth();
  const { authFetch } = useApi();
  const { year: urlYear, month: urlMonth } = useParams();
  const navigate = useNavigate();

  const [year, setYear]   = useState(parseInt(urlYear));
  const [month, setMonth] = useState(parseInt(urlMonth));
  const [data, setData]   = useState({});
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchData = async (yr, m) => {
    setLoading(true);
    try {
      const monthStr = String(m).padStart(2, '0');
      const result = await authFetch(`/api/entries/${yr}/${monthStr}`);
      setData(result || {});
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load data');
    }
    setLoading(false);
  };

  useEffect(() => { 
    if (user) {
      fetchData(year, month);
    }
  }, [year, month, user]);

  const getMonthName = (m) => {
    const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return names[m - 1];
  };

  const goPrev = () => {
    let newYear = year, newMonth = month - 1;
    if (newMonth === 0) { 
      newMonth = 12; 
      newYear -= 1; 
    }
    setYear(newYear); 
    setMonth(newMonth);
    navigate(`/monthly/${newYear}/${newMonth}`);
  };

  const goNext = () => {
    let newYear = year, newMonth = month + 1;
    if (newMonth === 13) { 
      newMonth = 1; 
      newYear += 1; 
    }
    setYear(newYear); 
    setMonth(newMonth);
    navigate(`/monthly/${newYear}/${newMonth}`);
  };

  const formatValue = (value) => {
    const num = parseFloat(value || 0);
    return num === 0 ? '-' : `₹${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md">Go Back</button>
      </div>
    );
  }

  const monthlyTotal = Object.values(data).reduce((sum, dayData) => {
    return sum + (
      parseFloat(dayData.morning || 0) + 
      parseFloat(dayData.noon || 0) + 
      parseFloat(dayData.evening || 0) + 
      parseFloat(dayData.night || 0)
    );
  }, 0);

  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <div className="max-w-6xl mx-auto p-4">

      <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">◀</button>
          <h1 className="text-lg font-bold">{getMonthName(month)} {year}</h1>
          <button onClick={goNext} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">▶</button>
        </div>
        <button onClick={() => navigate('/')}
          className="px-4 py-1 text-sm rounded bg-blue-500 hover:bg-blue-600 text-white">
          Back to Home
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">

        <div className="hidden md:flex px-6 py-3 bg-gray-50 text-xs text-gray-500 border-b">
          <div className="w-32"></div>
          <div className="flex-grow grid grid-cols-4 gap-2">
            <span className="text-right">Morning</span>
            <span className="text-right">Noon</span>
            <span className="text-right">Evening</span>
            <span className="text-right">Night</span>
          </div>
          <div className="w-32 text-right">Total</div>
        </div>

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayData = data[dateStr] || {};
          const dateObj = new Date(dateStr);
          const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dayTotal = (
            parseFloat(dayData.morning || 0) +
            parseFloat(dayData.noon || 0) +
            parseFloat(dayData.evening || 0) +
            parseFloat(dayData.night || 0)
          );

          return (
            <div key={dateStr} className="flex items-center px-6 py-3 border-b hover:bg-gray-50">
              <div className="w-32 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                  {day}
                </div>
                <span className="text-sm">{weekday}</span>
              </div>
              
              <div className="flex-grow grid grid-cols-4 gap-2 text-sm">
                <div className="text-right">{formatValue(dayData.morning)}</div>
                <div className="text-right">{formatValue(dayData.noon)}</div>
                <div className="text-right">{formatValue(dayData.evening)}</div>
                <div className="text-right">{formatValue(dayData.night)}</div>
              </div>
              
              <div className="w-32 text-right text-green-600 font-semibold">
                {dayTotal > 0 ? `₹${dayTotal.toFixed(2)}` : '-'}
              </div>
            </div>
          );
        })}

        <div className="flex items-center px-6 py-3 bg-green-50 font-semibold">
          <div className="w-32 flex items-center gap-4">
            <div className="w-8 h-8"></div>
            <span>Monthly Total</span>
          </div>
          <div className="flex-grow grid grid-cols-4 gap-2 text-sm text-gray-500">
            <div className="text-right">-</div>
            <div className="text-right">-</div>
            <div className="text-right">-</div>
            <div className="text-right">-</div>
          </div>
          <div className="w-32 text-right text-green-700">
            ₹{monthlyTotal.toFixed(2)}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}