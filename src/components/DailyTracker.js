import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import useApi from '../utils/api';
import { CalendarIcon, ChartBarIcon } from './Icons';
import { Footer } from './Footer';

const MealCard = ({ title, time, value, onChange, onBlur, icon, color }) => (
  <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-l-4 ${color} p-6`}>
    <div className="flex items-center mb-4">
      <div className="text-3xl mr-3">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500">{time}</p>
      </div>
    </div>
    
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="0.00"
      />
    </div>
  </div>
);

export default function DailyTracker() {
  const { user } = useAuth();
  const { authFetch } = useApi();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState({ morning: '', noon: '', evening: '', night: '' });
  const [dailyTotal, setDailyTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTodayData();
  }, [date, user]);

  const loadTodayData = async () => {
    if (!user) return;
    
    const [year, month] = date.split('-');
    
    try {
      setIsLoading(true);
      const data = await authFetch(`/api/entries/${year}/${month}`);
      
      const dayData = data[date];
      if (dayData) {
        setMeals({
          morning: dayData.morning?.toString() || '',
          noon: dayData.noon?.toString() || '',
          evening: dayData.evening?.toString() || '',
          night: dayData.night?.toString() || ''
        });
        calculateTotal(dayData);
        showMessage('✅ Daily data loaded successfully!', 'success');
      } else {
        setMeals({ morning: '', noon: '', evening: '', night: '' });
        setDailyTotal(0);
        showMessage('📝 No entries found for this date', 'info');
      }
    } catch (err) {
      showMessage(`⚠️ Data loading error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = useCallback((data = meals) => {
    const total = Object.values(data)
      .map(val => parseFloat(val) || 0)
      .reduce((sum, val) => sum + val, 0);
    setDailyTotal(total);
  }, [meals]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const normalizedMeals = Object.fromEntries(
      Object.entries(meals).map(([key, value]) => [key, value === '' ? '0' : value])
    );
    
    try {
      await authFetch('/api/entry', {
        method: 'POST',
        body: { date, ...normalizedMeals }
      });
      
      showMessage('✅ Entry saved successfully!', 'success');
      loadTodayData();
    } catch (err) {
      showMessage(`❌ Save error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthlySummary = () => {
    const [year, month] = date.split('-');
    navigate(`/monthly/${year}/${month}`);
    showMessage(`📊 Loading monthly summary for ${month}-${year}...`, 'info');
  };

  const handleInputChange = useCallback((meal, value) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const newMeals = { ...meals, [meal]: value };
      setMeals(newMeals);
      calculateTotal(newMeals);
    }
  }, [meals, calculateTotal]);

  const handleInputBlur = useCallback((meal) => {
    if (meals[meal] === '') {
      const newMeals = { ...meals, [meal]: '0' };
      setMeals(newMeals);
      calculateTotal(newMeals);
    }
  }, [meals, calculateTotal]);

  const messageStyles = {
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${messageStyles[message.type]}`}>
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="mb-8 bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-blue-500" />
              Select Date
            </h2>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                showMessage(`📅 Viewing entries for ${e.target.value}`, 'info');
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button 
            onClick={handleMonthlySummary}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Monthly Summary</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MealCard
            title="Morning"
            time="7:00 AM - 10:30 AM"
            value={meals.morning}
            onChange={(v) => handleInputChange('morning', v)}
            onBlur={() => handleInputBlur('morning')}
            icon="🌅"
            color="border-yellow-400"
          />
          
          <MealCard
            title="Noon"
            time="12:00 AM - 3:00 PM"
            value={meals.noon}
            onChange={(v) => handleInputChange('noon', v)}
            onBlur={() => handleInputBlur('noon')}
            icon="☀️"
            color="border-orange-400"
          />
          
          <MealCard
            title="Evening"
            time="5:00 PM - 7:00 PM"
            value={meals.evening}
            onChange={(v) => handleInputChange('evening', v)}
            onBlur={() => handleInputBlur('evening')}
            icon="🌇"
            color="border-purple-400"
          />
          
          <MealCard
            title="Night"
            time="8:00 PM - 11:00 PM"
            value={meals.night}
            onChange={(v) => handleInputChange('night', v)}
            onBlur={() => handleInputBlur('night')}
            icon="🌙"
            color="border-blue-400"
          />
        </div>

        <div className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Daily Summary</h2>
          <p className="text-3xl font-bold text-green-600">₹{dailyTotal.toFixed(2)}</p>
          <p className="text-gray-600">Total spent on {date}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Entry</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleMonthlySummary}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Monthly Summary</span>
          </button>
        </div>
      </form>
      <Footer />
    </div>
  );
}