import React, { useState, useCallback, useEffect } from "react";
import {
  BarChart3, BarChart2, Map, Table, Gauge, Shield, Radio, Cpu, AlertTriangle,
  TrendingUp, TrendingDown, Clock, Target, Trophy, Settings, SlidersHorizontal,
  List, CheckCircle, X, TerminalSquare, Play, ArrowRight, RefreshCw,
  RotateCcw, Download, History, Train, Signal, FileText, GitBranch,
  Navigation, Layers, Zap, Edit, Globe, Compass, Mountain, Waves, Sun, 
  Trees, Crosshair, Activity
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// PERSISTENT SIMULATION STORAGE
class SimulationStorage {
  constructor() {
    this.storageKey = 'railoptima_simulations';
    this.maxStorage = 1000; // Store up to 1000 simulations
  }

  // Store a new simulation
  storeSimulation(simulation) {
    try {
      const existing = this.getAllSimulations();
      const newSimulation = {
        ...simulation,
        id: simulation.simId,
        timestamp: new Date().toISOString(),
        sessionInfo: {
          userAgent: navigator.userAgent,
          role: this.getCurrentUserRole(),
          sessionId: this.getSessionId()
        }
      };

      const updated = [newSimulation, ...existing].slice(0, this.maxStorage);
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      
      // Update analytics
      this.updateAnalytics(newSimulation);
      
      return true;
    } catch (error) {
      console.error('Error storing simulation:', error);
      return false;
    }
  }

  // Get all stored simulations
  getAllSimulations() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error retrieving simulations:', error);
      return [];
    }
  }

  // Get simulations for current user/role
  getUserSimulations() {
    const all = this.getAllSimulations();
    const currentRole = this.getCurrentUserRole();
    return all.filter(sim => sim.sessionInfo?.role === currentRole);
  }

  // Get best performing simulations
  getBestSimulations(count = 10) {
    const all = this.getAllSimulations();
    return all
      .sort((a, b) => (b.kpis?.rewardScore || 0) - (a.kpis?.rewardScore || 0))
      .slice(0, count);
  }

  // Get analytics data
  getAnalytics() {
    try {
      const analyticsKey = 'railoptima_analytics';
      const stored = localStorage.getItem(analyticsKey);
      return stored ? JSON.parse(stored) : this.initializeAnalytics();
    } catch (error) {
      console.error('Error retrieving analytics:', error);
      return this.initializeAnalytics();
    }
  }

  // Initialize analytics
  initializeAnalytics() {
    const analytics = {
      totalSimulations: 0,
      bestScore: 0,
      averageThroughput: 0,
      averageConflicts: 0,
      averageDelay: 0,
      roleStats: {
        admin: { count: 0, bestScore: 0 },
        operator: { count: 0, bestScore: 0 },
        analyst: { count: 0, bestScore: 0 }
      },
      dailyStats: {},
      weeklyStats: {},
      monthlyStats: {},
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('railoptima_analytics', JSON.stringify(analytics));
    return analytics;
  }

  // Update analytics with new simulation
  updateAnalytics(simulation) {
    const analytics = this.getAnalytics();
    const simulations = this.getAllSimulations();
    
    // Update overall stats
    analytics.totalSimulations = simulations.length;
    analytics.bestScore = Math.max(...simulations.map(s => s.kpis?.rewardScore || 0), analytics.bestScore);
    analytics.averageThroughput = simulations.reduce((sum, s) => sum + (s.kpis?.maxThroughput || 0), 0) / simulations.length;
    analytics.averageConflicts = simulations.reduce((sum, s) => sum + (s.kpis?.totalConflicts || 0), 0) / simulations.length;
    analytics.averageDelay = simulations.reduce((sum, s) => sum + (s.kpis?.avgDelay || 0), 0) / simulations.length;
    
    // Update role stats
    const role = simulation.sessionInfo?.role || 'unknown';
    if (!analytics.roleStats[role]) {
      analytics.roleStats[role] = { count: 0, bestScore: 0 };
    }
    analytics.roleStats[role].count++;
    analytics.roleStats[role].bestScore = Math.max(
      analytics.roleStats[role].bestScore,
      simulation.kpis?.rewardScore || 0
    );
    
    // Update time-based stats
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const weekKey = this.getWeekKey(now);
    const monthKey = now.toISOString().slice(0, 7); // YYYY-MM
    
    if (!analytics.dailyStats[dateKey]) {
      analytics.dailyStats[dateKey] = { count: 0, totalScore: 0, bestScore: 0 };
    }
    analytics.dailyStats[dateKey].count++;
    analytics.dailyStats[dateKey].totalScore += simulation.kpis?.rewardScore || 0;
    analytics.dailyStats[dateKey].bestScore = Math.max(
      analytics.dailyStats[dateKey].bestScore,
      simulation.kpis?.rewardScore || 0
    );
    
    analytics.lastUpdated = new Date().toISOString();
    localStorage.setItem('railoptima_analytics', JSON.stringify(analytics));
  }

  // Get week key for weekly stats
  getWeekKey(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${weekNumber}`;
  }

  // Get current user role (from localStorage or context)
  getCurrentUserRole() {
    try {
      const userRole = localStorage.getItem('railoptima_current_role');
      return userRole || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  // Set current user role
  setCurrentUserRole(role) {
    try {
      localStorage.setItem('railoptima_current_role', role);
    } catch (error) {
      console.error('Error setting user role:', error);
    }
  }

  // Get session ID
  getSessionId() {
    try {
      let sessionId = localStorage.getItem('railoptima_session_id');
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('railoptima_session_id', sessionId);
      }
      return sessionId;
    } catch (error) {
      return 'unknown_session';
    }
  }

  // Clear old data (keep only last N simulations)
  clearOldData(keepCount = 500) {
    try {
      const all = this.getAllSimulations();
      const recent = all.slice(0, keepCount);
      localStorage.setItem(this.storageKey, JSON.stringify(recent));
      return true;
    } catch (error) {
      console.error('Error clearing old data:', error);
      return false;
    }
  }

  // Export data
  exportData() {
    try {
      const data = {
        simulations: this.getAllSimulations(),
        analytics: this.getAnalytics(),
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `railoptima_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting data:', error);
      return false;
    }
  }
}

// Global storage instance
const simulationStorage = new SimulationStorage();

// MOCK DATA 
const INDIAN_TRAINS = [
  // Existing trains
  { id: "T01", number: "12301", name: "Howrah Rajdhani",        origin: "Howrah",            destination: "New Delhi",          priority: "HIGH",   type: "Rajdhani" },
  { id: "T02", number: "12951", name: "Mumbai Rajdhani",        origin: "Mumbai Central",    destination: "New Delhi",          priority: "HIGH",   type: "Rajdhani" },
  { id: "T03", number: "22691", name: "Rajdhani Express",       origin: "KSR Bengaluru",     destination: "Hazrat Nizamuddin",  priority: "HIGH",   type: "Rajdhani" },
  { id: "T04", number: "12002", name: "Bhopal Shatabdi",        origin: "New Delhi",         destination: "Habibganj",          priority: "MEDIUM", type: "Shatabdi" },
  { id: "T05", number: "12009", name: "Mumbai Shatabdi",        origin: "Mumbai Central",    destination: "Ahmedabad",          priority: "MEDIUM", type: "Shatabdi" },
  { id: "T06", number: "12051", name: "Janshatabdi Exp",        origin: "Dadar",             destination: "Madgaon",            priority: "MEDIUM", type: "Shatabdi" },
  { id: "T07", number: "11001", name: "Udyan Express",          origin: "Mumbai CST",        destination: "KSR Bengaluru",      priority: "LOW",    type: "Express"  },
  { id: "T08", number: "12629", name: "Karnataka Express",       origin: "New Delhi",         destination: "KSR Bengaluru",      priority: "LOW",    type: "Express"  },
  { id: "T09", number: "12721", name: "Dakshin Express",        origin: "Hazrat Nizamuddin", destination: "Hyderabad",          priority: "LOW",    type: "Express"  },
  { id: "T10", number: "13151", name: "Kolkata Express",        origin: "Jammu Tawi",        destination: "Kolkata",            priority: "LOW",    type: "Express"  },
  
  // Additional 40 Indian trains
  { id: "T11", number: "12423", name: "Dibrugarh Rajdhani",     origin: "Dibrugarh",         destination: "New Delhi",          priority: "HIGH",   type: "Rajdhani" },
  { id: "T12", number: "12435", name: "Guwahati Rajdhani",      origin: "Guwahati",          destination: "New Delhi",          priority: "HIGH",   type: "Rajdhani" },
  { id: "T13", number: "12437", name: "Secunderabad Rajdhani",  origin: "Secunderabad",     destination: "New Delhi",          priority: "HIGH",   type: "Rajdhani" },
  { id: "T14", number: "12449", name: "Goa Sampark Kranti",     origin: "Madgaon",           destination: "New Delhi",          priority: "HIGH",   type: "Sampark Kranti" },
  { id: "T15", number: "12493", name: "Lucknow SF Express",      origin: "New Delhi",         destination: "Lucknow",            priority: "HIGH",   type: "Superfast" },
  { id: "T16", number: "12505", name: "Kamakhya Express",        origin: "Dibrugarh",         destination: "Kolkata",            priority: "HIGH",   type: "Superfast" },
  { id: "T17", number: "12511", name: "Raptisagar Express",      origin: "Kochuveli",         destination: "Gorakhpur",           priority: "HIGH",   type: "Superfast" },
  { id: "T18", number: "12517", name: "Guwahati Express",        origin: "Bangalore",         destination: "Guwahati",            priority: "HIGH",   type: "Superfast" },
  { id: "T19", number: "12521", name: "Rajendra Express",       origin: "Tatanagar",         destination: "Patna",              priority: "HIGH",   type: "Superfast" },
  { id: "T20", number: "12555", name: "Gorakhpur Express",      origin: "Bhatni",            destination: "Gorakhpur",           priority: "HIGH",   type: "Superfast" },
  
  { id: "T21", number: "12617", name: "Ernakulam Express",      origin: "Hazrat Nizamuddin", destination: "Ernakulam",          priority: "MEDIUM", type: "Superfast" },
  { id: "T22", number: "12625", name: "Kerala Express",         origin: "New Delhi",         destination: "Thiruvananthapuram",  priority: "MEDIUM", type: "Superfast" },
  { id: "T23", number: "12627", name: "Karnataka Express",       origin: "New Delhi",         destination: "Bangalore",          priority: "MEDIUM", type: "Superfast" },
  { id: "T24", number: "12645", name: "Millennium Express",      origin: "Ernakulam",         destination: "New Delhi",          priority: "MEDIUM", type: "Superfast" },
  { id: "T25", number: "12655", name: "Navjeevan Express",       origin: "Ahmedabad",         destination: "Chennai Central",    priority: "MEDIUM", type: "Superfast" },
  { id: "T26", number: "12665", name: "Hampi Express",           origin: "KSR Bengaluru",     destination: "Hubballi",            priority: "MEDIUM", type: "Express" },
  { id: "T27", number: "12677", name: "Ernakulam Express",      origin: "Bangalore",         destination: "Ernakulam",          priority: "MEDIUM", type: "Express" },
  { id: "T28", number: "12685", name: "Chennai Express",         origin: "Mumbai CST",        destination: "Chennai Central",    priority: "MEDIUM", type: "Superfast" },
  { id: "T29", number: "12695", name: "Trivandrum Express",     origin: "Madurai",           destination: "Chennai Egmore",      priority: "MEDIUM", type: "Express" },
  { id: "T30", number: "12701", name: "Hyderabad Express",       origin: "Mumbai CST",        destination: "Hyderabad",          priority: "MEDIUM", type: "Superfast" },
  
  { id: "T31", number: "12703", name: "Godavari Express",        origin: "Hyderabad",          destination: "Visakhapatnam",      priority: "MEDIUM", type: "Superfast" },
  { id: "T32", number: "12707", name: "Gowtami Express",         origin: "Kacheguda",          destination: "Nizamuddin",          priority: "MEDIUM", type: "Superfast" },
  { id: "T33", number: "12723", name: "Andhra Pradesh Express",  origin: "New Delhi",         destination: "Hyderabad",          priority: "MEDIUM", type: "Superfast" },
  { id: "T34", number: "12731", name: "Gwalior Express",         origin: "Mysuru",             destination: "Gwalior",            priority: "MEDIUM", type: "Superfast" },
  { id: "T35", number: "12739", name: "Garib Rath Express",      origin: "Secunderabad",     destination: "Hazrat Nizamuddin",  priority: "MEDIUM", type: "Garib Rath" },
  { id: "T36", number: "12745", name: "Intercity Express",       origin: "KSR Bengaluru",     destination: "Kacheguda",          priority: "MEDIUM", type: "Intercity" },
  { id: "T37", number: "12759", name: "Charminar Express",      origin: "Secunderabad",     destination: "Tirupati",           priority: "MEDIUM", type: "Superfast" },
  { id: "T38", number: "12785", name: "Karnataka Express",       origin: "Mysuru",             destination: "Gwalior",            priority: "MEDIUM", type: "Express" },
  { id: "T39", number: "12787", name: "Vijayawada Express",      origin: "Hubballi",          destination: "Vijayawada",          priority: "MEDIUM", type: "Superfast" },
  { id: "T40", number: "12791", name: "Secunderabad Express",    origin: "Nizamuddin",         destination: "Secunderabad",       priority: "MEDIUM", type: "Superfast" },
  
  { id: "T41", number: "12801", name: "Purushottam Express",     origin: "Puri",              destination: "New Delhi",          priority: "MEDIUM", type: "Superfast" },
  { id: "T42", number: "12833", name: "Ahilyanagari Express",    origin: "Indore",            destination: "New Delhi",          priority: "MEDIUM", type: "Superfast" },
  { id: "T43", number: "12835", name: "Hatia Express",           origin: "Yesvantpur",         destination: "Hatia",              priority: "MEDIUM", type: "Superfast" },
  { id: "T44", number: "12841", name: "Puri Express",            origin: "Shalimar",          destination: "Puri",                priority: "MEDIUM", type: "Express" },
  { id: "T45", number: "12849", name: "Konark Express",          origin: "Bhubaneswar",        destination: "Mumbai CST",         priority: "MEDIUM", type: "Superfast" },
  { id: "T46", number: "12859", name: "Gitanjali Express",       origin: "Mumbai CST",        destination: "Howrah",             priority: "MEDIUM", type: "Superfast" },
  { id: "T47", number: "12861", name: "Link Express",            origin: "Mumbai CST",        destination: "Kolkata",            priority: "MEDIUM", type: "Express" },
  { id: "T48", number: "12869", name: "Howrah Express",          origin: "Mumbai CST",        destination: "Howrah",             priority: "MEDIUM", type: "Superfast" },
  { id: "T49", number: "12873", name: "Gondwana Express",        origin: "Raipur",            destination: "Hazrat Nizamuddin",  priority: "MEDIUM", type: "Superfast" },
  { id: "T50", number: "12877", name: "Vivek Express",           origin: "Howrah",             destination: "Okha",               priority: "MEDIUM", type: "Superfast" },
  
  // Premium trains
  { id: "T51", number: "12001", name: "Rani Chennamma Express",  origin: "KSR Bengaluru",     destination: "Miraj",              priority: "HIGH",   type: "Superfast" },
  { id: "T52", number: "12003", name: "Lucknow Shatabdi",       origin: "New Delhi",         destination: "Lucknow",            priority: "HIGH",   type: "Shatabdi" },
  { id: "T53", number: "12005", name: "Kalka Shatabdi",         origin: "New Delhi",         destination: "Kalka",              priority: "HIGH",   type: "Shatabdi" },
  { id: "T54", number: "12007", name: "Chennai Shatabdi",       origin: "Chennai Central",  destination: "Bangalore",          priority: "HIGH",   type: "Shatabdi" },
  { id: "T55", number: "12011", name: "Kalka Shatabdi",         origin: "New Delhi",         destination: "Kalka",              priority: "HIGH",   type: "Shatabdi" },
  { id: "T56", number: "12013", name: "Amritsar Shatabdi",      origin: "New Delhi",         destination: "Amritsar",           priority: "HIGH",   type: "Shatabdi" },
  { id: "T57", number: "12015", name: "Ajmer Shatabdi",         origin: "New Delhi",         destination: "Ajmer",              priority: "HIGH",   type: "Shatabdi" },
  { id: "T58", number: "12017", name: "Chandigarh Shatabdi",    origin: "New Delhi",         destination: "Chandigarh",         priority: "HIGH",   type: "Shatabdi" },
  { id: "T59", number: "12019", name: "Ranchi Shatabdi",        origin: "Howrah",            destination: "Ranchi",             priority: "HIGH",   type: "Shatabdi" },
  { id: "T60", number: "12021", name: "Jan Shatabdi Express",    origin: "Howrah",            destination: "Jamshedpur",         priority: "HIGH",   type: "Shatabdi" },
  
  // Duronto Express trains
  { id: "T61", number: "12201", name: "Kochuveli Duronto",       origin: "Kochuveli",         destination: "Nizamuddin",         priority: "HIGH",   type: "Duronto" },
  { id: "T62", number: "12203", name: "Thiruvananthapuram Duronto", origin: "Thiruvananthapuram", destination: "Nizamuddin",         priority: "HIGH",   type: "Duronto" },
  { id: "T63", number: "12205", name: "YPR Duronto",             origin: "Yesvantpur",         destination: "Nizamuddin",         priority: "HIGH",   type: "Duronto" },
  { id: "T64", number: "12207", name: "KSR Bengaluru Duronto",  origin: "KSR Bengaluru",     destination: "Delhi Sarai Rohilla", priority: "HIGH",   type: "Duronto" },
  { id: "T65", number: "12213", name: "YPR Duronto",             origin: "Yesvantpur",         destination: "Hazrat Nizamuddin",  priority: "HIGH",   type: "Duronto" },
  { id: "T66", number: "12217", name: "Sachkhand Express",       origin: "Nizamuddin",         destination: "Huzur Sahib Nanded",  priority: "HIGH",   type: "Superfast" },
  { id: "T67", number: "12219", name: "Lichchavi Express",       origin: "Samastipur",        destination: "New Delhi",          priority: "HIGH",   type: "Superfast" },
  { id: "T68", number: "12221", name: "Lalkuan Express",        origin: "Howrah",            destination: "Lalkuan",            priority: "HIGH",   type: "Superfast" },
  { id: "T69", number: "12223", name: "Lucknow Express",        origin: "Mumbai CST",        destination: "Lucknow",            priority: "HIGH",   type: "Superfast" },
  { id: "T70", number: "12227", name: "Vande Bharat Express",   origin: "New Delhi",         destination: "Varanasi",           priority: "HIGH",   type: "Vande Bharat" },
  
  // Additional premium and superfast trains
  { id: "T71", number: "12235", name: "Nagarjuna Express",       origin: "Secunderabad",     destination: "Guntur",             priority: "MEDIUM", type: "Superfast" },
  { id: "T72", number: "12237", name: "Mahabodhi Express",      origin: "New Delhi",         destination: "Gaya",               priority: "MEDIUM", type: "Superfast" },
  { id: "T73", number: "12239", name: "Seemanchal Express",     origin: "New Delhi",         destination: "Bihar",              priority: "MEDIUM", type: "Superfast" },
  { id: "T74", number: "12241", name: "Coromandel Express",      origin: "Chennai Central",  destination: "Howrah",             priority: "MEDIUM", type: "Superfast" },
  { id: "T75", number: "12243", name: "RGD Duronto",             origin: "Rajendra Nagar",    destination: "H.Nizamuddin",       priority: "MEDIUM", type: "Duronto" },
  { id: "T76", number: "12245", name: "YPR Howrah Express",      origin: "Yesvantpur",         destination: "Howrah",             priority: "MEDIUM", type: "Superfast" },
  { id: "T77", number: "12247", name: "Bhagirathi Express",      origin: "Howrah",            destination: "Dehradun",           priority: "MEDIUM", type: "Superfast" },
  { id: "T78", number: "12249", name: "YPR Kanpur Express",      origin: "Yesvantpur",         destination: "Kanpur Central",     priority: "MEDIUM", type: "Superfast" },
  { id: "T79", number: "12251", name: "Wainganga Express",       origin: "Kazipet",           destination: "Yasvantpur",         priority: "MEDIUM", type: "Superfast" },
  { id: "T80", number: "12257", name: "YPR Kochuveli Express",   origin: "Yesvantpur",         destination: "Kochuveli",          priority: "MEDIUM", type: "Superfast" },
  
  // Mail and Express trains
  { id: "T81", number: "11027", name: "Chennai Mail",            origin: "Mumbai CST",        destination: "Chennai Central",    priority: "LOW",    type: "Mail" },
  { id: "T82", number: "11029", name: "Bhusaval Pune Express",  origin: "Bhusaval",          destination: "Pune",               priority: "LOW",    type: "Express" },
  { id: "T83", number: "11033", name: "Darbhanga Express",       origin: "Yesvantpur",         destination: "Darbhanga",          priority: "LOW",    type: "Express" },
  { id: "T84", number: "11037", name: "GKP Pune Express",       origin: "Gorakhpur",          destination: "Pune",               priority: "LOW",    type: "Express" },
  { id: "T85", number: "11043", name: "Madurai Express",          origin: "Chennai Central",  destination: "Madurai",            priority: "LOW",    type: "Express" },
  { id: "T86", number: "11045", name: "Dadar Express",           origin: "Dadar",             destination: "Madgaon",            priority: "LOW",    type: "Express" },
  { id: "T87", number: "11049", name: "Ahmedabad Express",       origin: "Pune",              destination: "Ahmedabad",          priority: "LOW",    type: "Express" },
  { id: "T88", number: "11057", name: "Amravati Express",        origin: "Mumbai CST",        destination: "Amravati",           priority: "LOW",    type: "Express" },
  { id: "T89", number: "11059", name: "Chhapra Express",         origin: "Lokmanya Tilak",    destination: "Chhapra",            priority: "LOW",    type: "Express" },
  { id: "T90", number: "11061", name: "LTT Jaynagar Express",    origin: "Lokmanya Tilak",    destination: "Jaynagar",           priority: "LOW",    type: "Express" },
  
  // Additional regional trains
  { id: "T91", number: "11071", name: "Kamayani Express",        origin: "Mumbai CST",        destination: "Varanasi",           priority: "LOW",    type: "Express" },
  { id: "T92", number: "11073", name: "Decan Express",           origin: "Pune",              destination: "C Shivaji Maharaj",    priority: "LOW",    type: "Express" },
  { id: "T93", number: "11077", name: "Jhelum Express",          origin: "Pune",              destination: "Jammu Tawi",         priority: "LOW",    type: "Express" },
  { id: "T94", number: "11081", name: "GKP YPR Express",         origin: "Gorakhpur",          destination: "Yesvantpur",         priority: "LOW",    type: "Express" },
  { id: "T95", number: "11083", name: "CST TIRUPATI Express",    origin: "Mumbai CST",        destination: "Tirupati",           priority: "LOW",    type: "Express" },
  { id: "T96", number: "11085", name: "LTT BSR Express",         origin: "Lokmanya Tilak",    destination: "Vasai Road",         priority: "LOW",    type: "Express" },
  { id: "T97", number: "11087", name: "Vikramshila Express",     origin: "Patna",             destination: "Bhagalpur",           priority: "LOW",    type: "Express" },
  { id: "T98", number: "11089", name: "Varanasi Express",        origin: "Pune",              destination: "Varanasi",           priority: "LOW",    type: "Express" },
  { id: "T99", number: "11093", name: "Maharashtra Express",     origin: "Gondia",            destination: "Kolhapur",           priority: "LOW",    type: "Express" },
  { id: "T100", number: "11095", name: "Pune Danapur Express",    origin: "Pune",              destination: "Danapur",            priority: "LOW",    type: "Express" }
];

const TRACKS = [
  "Track-1", "Track-2", "Track-3", "Track-4", "Track-5", 
  "Track-6", "Track-7", "Track-8", "Track-9", "Track-10",
  "Track-A", "Track-B", "Track-C", "Track-D", "Track-E",
  "Track-F", "Track-G", "Track-H", "Track-I", "Track-J",
  "Main-Line-1", "Main-Line-2", "Central-Line", "Western-Line", "Eastern-Line",
  "Northern-Line", "Southern-Line", "Golden-Quadrilateral", "Grand-Trunk", "Konkan-Railway"
];

const STATION_NODES = [
  // Major Metropolitan Cities
  { id: "S1",  name: "New Delhi",         x: 320, y: 80  },
  { id: "S2",  name: "Mumbai Central",    x: 120, y: 280 },
  { id: "S3",  name: "Howrah",            x: 560, y: 100 },
  { id: "S4",  name: "Chennai Central",   x: 340, y: 420 },
  { id: "S5",  name: "KSR Bengaluru",     x: 240, y: 380 },
  { id: "S6",  name: "Hyderabad",         x: 300, y: 310 },
  
  // Major Junction Stations
  { id: "S7",  name: "Ahmedabad",         x: 140, y: 170 },
  { id: "S8",  name: "Bhopal",            x: 280, y: 200 },
  { id: "S9",  name: "Nagpur",            x: 330, y: 260 },
  { id: "S10", name: "Patna",             x: 450, y: 140 },
  { id: "S11", name: "Lucknow",           x: 380, y: 120 },
  { id: "S12", name: "Jaipur",            x: 260, y: 140 },
  { id: "S13", name: "Kanpur",            x: 360, y: 160 },
  { id: "S14", name: "Allahabad",         x: 400, y: 180 },
  { id: "S15", name: "Agra",              x: 340, y: 100 },
  
  // Important Regional Stations
  { id: "S16", name: "Guwahati",          x: 520, y: 60  },
  { id: "S17", name: "Dibrugarh",         x: 540, y: 40  },
  { id: "S18", name: "Siliguri",          x: 500, y: 80  },
  { id: "S19", name: "Bhubaneswar",       x: 480, y: 240 },
  { id: "S20", name: "Visakhapatnam",     x: 420, y: 280 },
  { id: "S21", name: "Vijayawada",        x: 360, y: 340 },
  { id: "S22", name: "Secunderabad",      x: 300, y: 310 },
  { id: "S23", name: "Bangalore City",    x: 240, y: 380 },
  { id: "S24", name: "Mysuru",            x: 220, y: 400 },
  { id: "S25", name: "Coimbatore",        x: 280, y: 440 },
  
  // Southern Stations
  { id: "S26", name: "Kochuveli",         x: 260, y: 460 },
  { id: "S27", name: "Thiruvananthapuram", x: 240, y: 480 },
  { id: "S28", name: "Madurai",           x: 320, y: 440 },
  { id: "S29", name: "Tiruchirappalli",  x: 300, y: 420 },
  { id: "S30", name: "Salem",             x: 260, y: 400 },
  
  // Western Stations
  { id: "S31", name: "Pune",              x: 160, y: 320 },
  { id: "S32", name: "Solapur",           x: 180, y: 340 },
  { id: "S33", name: "Hubballi",          x: 200, y: 360 },
  { id: "S34", name: "Belagavi",          x: 180, y: 380 },
  { id: "S35", name: "Mangaluru",         x: 160, y: 420 },
  { id: "S36", name: "Goa Madgaon",       x: 140, y: 400 },
  { id: "S37", name: "Vasai Road",        x: 120, y: 300 },
  { id: "S38", name: "Surat",             x: 160, y: 220 },
  { id: "S39", name: "Vadodara",          x: 140, y: 200 },
  { id: "S40", name: "Rajkot",            x: 100, y: 180 },
  
  // Northern Stations
  { id: "S41", name: "Jammu Tawi",        x: 320, y: 40  },
  { id: "S42", name: "Amritsar",          x: 280, y: 60  },
  { id: "S43", name: "Chandigarh",        x: 300, y: 80  },
  { id: "S44", name: "Dehradun",          x: 340, y: 60  },
  { id: "S45", name: "Haridwar",          x: 320, y: 60  },
  { id: "S46", name: "Ludhiana",          x: 260, y: 80  },
  { id: "S47", name: "Jalandhar",         x: 240, y: 80  },
  { id: "S48", name: "Pathankot",         x: 220, y: 60  },
  { id: "S49", name: "Shimla",            x: 340, y: 40  },
  { id: "S50", name: "Kalka",             x: 320, y: 60  },
  
  // Eastern Stations
  { id: "S51", name: "Kolkata",           x: 560, y: 100 },
  { id: "S52", name: "Asansol",           x: 540, y: 120 },
  { id: "S53", name: "Dhanbad",           x: 520, y: 140 },
  { id: "S54", name: "Ranchi",            x: 480, y: 180 },
  { id: "S55", name: "Jamshedpur",        x: 500, y: 160 },
  { id: "S56", name: "Bokaro",            x: 460, y: 160 },
  { id: "S57", name: "Gaya",              x: 440, y: 160 },
  { id: "S58", name: "Mughalsarai",       x: 420, y: 140 },
  { id: "S59", name: "Varanasi",          x: 400, y: 140 },
  { id: "S60", name: "Allahabad",         x: 400, y: 180 },
  
  // Central Stations
  { id: "S61", name: "Indore",            x: 200, y: 220 },
  { id: "S62", name: "Ujjain",            x: 220, y: 220 },
  { id: "S63", name: "Gwalior",           x: 320, y: 120 },
  { id: "S64", name: "Jhansi",            x: 300, y: 140 },
  { id: "S65", name: "Bhilai",            x: 380, y: 240 },
  { id: "S66", name: "Raipur",            x: 360, y: 260 },
  { id: "S67", name: "Bilaspur",          x: 340, y: 280 },
  { id: "S68", name: "Nagpur",            x: 330, y: 260 },
  { id: "S69", name: "Aurangabad",        x: 200, y: 300 },
  { id: "S70", name: "Nanded",            x: 260, y: 320 },
  
  // Additional Important Stations
  { id: "S71", name: "Tatanagar",          x: 500, y: 140 },
  { id: "S72", name: "Kharagpur",          x: 520, y: 120 },
  { id: "S73", name: "Cuttack",            x: 480, y: 220 },
  { id: "S74", name: "Puri",              x: 500, y: 200 },
  { id: "S75", name: "Tirupati",          x: 340, y: 360 },
  { id: "S76", name: "Guntur",            x: 320, y: 340 },
  { id: "S77", name: "Nellore",           x: 340, y: 320 },
  { id: "S78", name: "Vijayawada",        x: 360, y: 340 },
  { id: "S79", name: "Warangal",          x: 320, y: 320 },
  { id: "S80", name: "Kazipet",           x: 340, y: 300 }
];

const TRACK_PATHS = [
  // Golden Quadrilateral Routes (Major Connections)
  { from: "S1",  to: "S8",  track: "Golden-Quadrilateral" },  // Delhi-Bhopal
  { from: "S8",  to: "S2",  track: "Golden-Quadrilateral" },  // Bhopal-Mumbai
  { from: "S2",  to: "S31", track: "Golden-Quadrilateral" },  // Mumbai-Pune
  { from: "S31", to: "S5",  track: "Golden-Quadrilateral" },  // Pune-Bengaluru
  { from: "S5",  to: "S4",  track: "Golden-Quadrilateral" },  // Bengaluru-Chennai
  { from: "S4",  to: "S78", track: "Golden-Quadrilateral" },  // Chennai-Vijayawada
  { from: "S78", to: "S3",  track: "Golden-Quadrilateral" },  // Vijayawada-Howrah
  { from: "S3",  to: "S10", track: "Golden-Quadrilateral" },  // Howrah-Patna
  { from: "S10", to: "S1",  track: "Golden-Quadrilateral" },  // Patna-Delhi
  
  // Northern Railway Routes
  { from: "S1",  to: "S15", track: "Northern-Line" },        // Delhi-Agra
  { from: "S1",  to: "S11", track: "Northern-Line" },        // Delhi-Lucknow
  { from: "S1",  to: "S12", track: "Northern-Line" },        // Delhi-Jaipur
  { from: "S1",  to: "S43", track: "Northern-Line" },        // Delhi-Chandigarh
  { from: "S1",  to: "S42", track: "Northern-Line" },        // Delhi-Amritsar
  { from: "S1",  to: "S41", track: "Northern-Line" },        // Delhi-Jammu
  { from: "S11", to: "S13", track: "Northern-Line" },        // Lucknow-Kanpur
  { from: "S11", to: "S14", track: "Northern-Line" },        // Lucknow-Allahabad
  { from: "S12", to: "S39", track: "Northern-Line" },        // Jaipur-Vadodara
  { from: "S13", to: "S63", track: "Northern-Line" },        // Kanpur-Gwalior
  { from: "S14", to: "S59", track: "Northern-Line" },        // Allahabad-Varanasi
  { from: "S15", to: "S64", track: "Northern-Line" },        // Agra-Jhansi
  
  // Western Railway Routes
  { from: "S2",  to: "S39", track: "Western-Line" },         // Mumbai-Vadodara
  { from: "S2",  to: "S37", track: "Western-Line" },         // Mumbai-Vasai Road
  { from: "S2",  to: "S38", track: "Western-Line" },         // Mumbai-Surat
  { from: "S39", to: "S7",  track: "Western-Line" },         // Vadodara-Ahmedabad
  { from: "S39", to: "S40", track: "Western-Line" },         // Vadodara-Rajkot
  { from: "S38", to: "S39", track: "Western-Line" },         // Surat-Vadodara
  { from: "S31", to: "S32", track: "Western-Line" },         // Pune-Solapur
  { from: "S32", to: "S33", track: "Western-Line" },         // Solapur-Hubballi
  { from: "S33", to: "S34", track: "Western-Line" },         // Hubballi-Belagavi
  { from: "S34", to: "S36", track: "Western-Line" },         // Belagavi-Goa
  { from: "S36", to: "S35", track: "Western-Line" },         // Goa-Mangaluru
  { from: "S31", to: "S2",  track: "Western-Line" },         // Pune-Mumbai
  
  // Eastern Railway Routes
  { from: "S3",  to: "S72", track: "Eastern-Line" },           // Howrah-Kharagpur
  { from: "S72", to: "S71", track: "Eastern-Line" },          // Kharagpur-Tatanagar
  { from: "S71", to: "S55", track: "Eastern-Line" },          // Tatanagar-Jamshedpur
  { from: "S3",  to: "S52", track: "Eastern-Line" },          // Howrah-Asansol
  { from: "S52", to: "S53", track: "Eastern-Line" },          // Asansol-Dhanbad
  { from: "S3",  to: "S51", track: "Eastern-Line" },          // Howrah-Kolkata
  { from: "S51", to: "S73", track: "Eastern-Line" },          // Kolkata-Cuttack
  { from: "S73", to: "S19", track: "Eastern-Line" },          // Cuttack-Bhubaneswar
  { from: "S19", to: "S74", track: "Eastern-Line" },          // Bhubaneswar-Puri
  { from: "S19", to: "S20", track: "Eastern-Line" },          // Bhubaneswar-Visakhapatnam
  { from: "S20", to: "S78", track: "Eastern-Line" },          // Visakhapatnam-Vijayawada
  
  // Southern Railway Routes
  { from: "S4",  to: "S29", track: "Southern-Line" },          // Chennai-Tiruchirappalli
  { from: "S29", to: "S28", track: "Southern-Line" },          // Tiruchirappalli-Madurai
  { from: "S28", to: "S25", track: "Southern-Line" },          // Madurai-Coimbatore
  { from: "S25", to: "S5",  track: "Southern-Line" },          // Coimbatore-Bengaluru
  { from: "S4",  to: "S77", track: "Southern-Line" },          // Chennai-Nellore
  { from: "S77", to: "S78", track: "Southern-Line" },          // Nellore-Vijayawada
  { from: "S78", to: "S21", track: "Southern-Line" },          // Vijayawada-Secunderabad
  { from: "S21", to: "S6",  track: "Southern-Line" },          // Secunderabad-Hyderabad
  { from: "S6",  to: "S22", track: "Southern-Line" },          // Hyderabad-Secunderabad
  { from: "S5",  to: "S23", track: "Southern-Line" },          // Bengaluru-Bangalore City
  { from: "S23", to: "S24", track: "Southern-Line" },          // Bangalore City-Mysuru
  { from: "S24", to: "S30", track: "Southern-Line" },          // Mysuru-Salem
  { from: "S30", to: "S25", track: "Southern-Line" },          // Salem-Coimbatore
  { from: "S25", to: "S35", track: "Southern-Line" },          // Coimbatore-Mangaluru
  { from: "S35", to: "S26", track: "Southern-Line" },          // Mangaluru-Kochuveli
  { from: "S26", to: "S27", track: "Southern-Line" },          // Kochuveli-Thiruvananthapuram
  
  // Central Railway Routes
  { from: "S1",  to: "S8",  track: "Central-Line" },           // Delhi-Bhopal
  { from: "S8",  to: "S61", track: "Central-Line" },           // Bhopal-Indore
  { from: "S61", to: "S62", track: "Central-Line" },           // Indore-Ujjain
  { from: "S8",  to: "S68", track: "Central-Line" },           // Bhopal-Nagpur
  { from: "S68", to: "S66", track: "Central-Line" },           // Nagpur-Raipur
  { from: "S66", to: "S67", track: "Central-Line" },           // Raipur-Bilaspur
  { from: "S67", to: "S65", track: "Central-Line" },           // Bilaspur-Bhilai
  { from: "S68", to: "S9",  track: "Central-Line" },            // Nagpur (duplicate for connectivity)
  { from: "S9",  to: "S70", track: "Central-Line" },            // Nagpur-Nanded
  { from: "S70", to: "S22", track: "Central-Line" },            // Nanded-Secunderabad
  { from: "S21", to: "S79", track: "Central-Line" },            // Vijayawada-Warangal
  { from: "S79", to: "S80", track: "Central-Line" },            // Warangal-Kazipet
  { from: "S80", to: "S68", track: "Central-Line" },            // Kazipet-Nagpur
  
  // Konkan Railway Routes
  { from: "S2",  to: "S37", track: "Konkan-Railway" },          // Mumbai-Vasai Road
  { from: "S37", to: "S36", track: "Konkan-Railway" },          // Vasai Road-Goa
  { from: "S36", to: "S35", track: "Konkan-Railway" },          // Goa-Mangaluru
  { from: "S35", to: "S26", track: "Konkan-Railway" },          // Mangaluru-Kochuveli
  
  // Grand Trunk Route (Historical Route)
  { from: "S1",  to: "S15", track: "Grand-Trunk" },           // Delhi-Agra
  { from: "S15", to: "S64", track: "Grand-Trunk" },            // Agra-Jhansi
  { from: "S64", to: "S63", track: "Grand-Trunk" },            // Jhansi-Gwalior
  { from: "S63", to: "S13", track: "Grand-Trunk" },            // Gwalior-Kanpur
  { from: "S13", to: "S11", track: "Grand-Trunk" },            // Kanpur-Lucknow
  { from: "S11", to: "S14", track: "Grand-Trunk" },            // Lucknow-Allahabad
  { from: "S14", to: "S59", track: "Grand-Trunk" },            // Allahabad-Varanasi
  { from: "S59", to: "S58", track: "Grand-Trunk" },            // Varanasi-Mughalsarai
  { from: "S58", to: "S72", track: "Grand-Trunk" },            // Mughalsarai-Kharagpur
  { from: "S72", to: "S3",  track: "Grand-Trunk" },            // Kharagpur-Howrah
  
  // Additional Track Connections (for better connectivity)
  { from: "S1",  to: "S9",  track: "Track-1" },                // Delhi-Nagpur
  { from: "S1",  to: "S10", track: "Track-2" },                // Delhi-Patna
  { from: "S1",  to: "S7",  track: "Track-3" },                // Delhi-Ahmedabad
  { from: "S2",  to: "S9",  track: "Track-4" },                // Mumbai-Nagpur
  { from: "S2",  to: "S31", track: "Track-5" },                // Mumbai-Pune
  { from: "S3",  to: "S10", track: "Track-6" },                // Howrah-Patna
  { from: "S4",  to: "S5",  track: "Track-7" },                // Chennai-Bengaluru
  { from: "S4",  to: "S6",  track: "Track-8" },                // Chennai-Hyderabad
  { from: "S5",  to: "S6",  track: "Track-9" },                // Bengaluru-Hyderabad
  { from: "S5",  to: "S31", track: "Track-10" },               // Bengaluru-Pune
  
  // Cross Connections (for network redundancy)
  { from: "S10", to: "S51", track: "Track-A" },                // Patna-Kolkata
  { from: "S11", to: "S54", track: "Track-B" },                // Lucknow-Ranchi
  { from: "S12", to: "S40", track: "Track-C" },                // Jaipur-Rajkot
  { from: "S13", to: "S52", track: "Track-D" },                // Kanpur-Asansol
  { from: "S14", to: "S60", track: "Track-E" },                // Allahabad (duplicate)
  { from: "S15", to: "S63", track: "Track-F" },                // Agra-Gwalior
  { from: "S16", to: "S17", track: "Track-G" },                // Guwahati-Dibrugarh
  { from: "S18", to: "S16", track: "Track-H" },                // Siliguri-Guwahati
  { from: "S19", to: "S20", track: "Track-I" },                // Bhubaneswar-Visakhapatnam
  { from: "S21", to: "S75", track: "Track-J" },                 // Vijayawada-Tirupati
  
  // Regional Connections
  { from: "S22", to: "S79", track: "Main-Line-1" },             // Secunderabad-Warangal
  { from: "S23", to: "S24", track: "Main-Line-2" },             // Bangalore City-Mysuru
  { from: "S26", to: "S27", track: "Main-Line-1" },             // Kochuveli-Thiruvananthapuram
  { from: "S28", to: "S29", track: "Main-Line-2" },             // Madurai-Tiruchirappalli
  { from: "S32", to: "S33", track: "Main-Line-1" },             // Solapur-Hubballi
  { from: "S41", to: "S42", track: "Main-Line-2" },             // Jammu-Amritsar
  { from: "S43", to: "S44", track: "Main-Line-1" },             // Chandigarh-Dehradun
  { from: "S45", to: "S50", track: "Main-Line-2" },             // Haridwar-Kalka
  { from: "S46", to: "S47", track: "Main-Line-1" },             // Ludhiana-Jalandhar
  { from: "S48", to: "S49", track: "Main-Line-2" }              // Pathankot-Shimla
];

// SIMULATION ENGINE
function generateSimId() {
  return "SIM-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2,5).toUpperCase();
}
function randInt(min, max)   { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return parseFloat((Math.random() * (max - min) + min).toFixed(1)); }

function runSimulation(history = []) {
  const simId = generateSimId();
  const availableTracks = TRACKS; // Use the comprehensive TRACKS array
  const schedule = INDIAN_TRAINS.map((train) => {
    const delayFactor = train.priority === "HIGH" ? 0.3 : train.priority === "MEDIUM" ? 0.5 : 0.8;
    const delay    = Math.random() < delayFactor ? randInt(0, 45) : 0;
    const track    = availableTracks[randInt(0, availableTracks.length - 1)];
    const startH   = randInt(5, 20), startM = randInt(0, 59);
    const endH     = (startH + randInt(2, 16)) % 24;
    const statusCode = delay === 0 ? "ON_TIME" : delay < 15 ? "MINOR_DELAY" : delay < 30 ? "MAJOR_DELAY" : "REASSIGNABLE";
    const nodeIdx  = randInt(0, STATION_NODES.length - 2);
    const fromNode = STATION_NODES[nodeIdx];
    const toNode   = STATION_NODES[nodeIdx + 1];
    const progress = randFloat(0.1, 0.9);
    return {
      ...train, track, delay, statusCode,
      startTime:     `${String(startH).padStart(2,"0")}:${String(startM).padStart(2,"0")}`,
      endTime:       `${String(endH).padStart(2,"0")}:${String(randInt(0,59)).padStart(2,"0")}`,
      rewardContrib: parseFloat((Math.random() * 10 - delay * 0.1).toFixed(2)),
      posX:          fromNode.x + (toNode.x - fromNode.x) * progress,
      posY:          fromNode.y + (toNode.y - fromNode.y) * progress,
    };
  });

  // Enhanced conflict detection and AI suggestion generation
  const trackMap = {};
  schedule.forEach(t => { if (!trackMap[t.track]) trackMap[t.track] = []; trackMap[t.track].push(t); });
  
  const conflicts = [];
  Object.entries(trackMap).forEach(([track, trains]) => {
    if (trains.length > 1) {
      for (let i = 0; i < trains.length - 1; i++) {
        const train1 = trains[i];
        const train2 = trains[i + 1];
        
        // Intelligent track suggestion based on train priority and availability
        const alternativeTracks = availableTracks.filter(t => t !== track);
        const bestAlternative = alternativeTracks.reduce((best, altTrack) => {
          const currentUsage = trackMap[altTrack] ? trackMap[altTrack].length : 0;
          const bestUsage = trackMap[best] ? trackMap[best].length : 0;
          return currentUsage < bestUsage ? altTrack : best;
        }, alternativeTracks[0]);
        
        // Calculate impact metrics
        const priorityBonus = train2.priority === "HIGH" ? 15 : train2.priority === "MEDIUM" ? 10 : 5;
        const delayReduction = randInt(8, 20) + priorityBonus;
        const throughputGain = randFloat(3, 10) + (train2.priority === "HIGH" ? 2 : 0);
        const confidenceScore = Math.min(95, 75 + priorityBonus + (20 - (trackMap[bestAlternative] || []).length * 5));
        
        conflicts.push({
          id: `C${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          track,
          train1: train1.name,   train1Id: train1.id,
          train2: train2.name, train2Id: train2.id,
          suggestion: `Reassign ${train2.name} to ${bestAlternative}`,
          delayReduction,
          throughputGain,
          confidenceScore,
          priority: train2.priority,
          alternativeTracks: alternativeTracks.slice(0, 3),
          reasoning: `${bestAlternative} has lower current usage and better capacity for ${train2.priority} priority train`
        });
      }
    }
  });

  const avgDelay    = parseFloat((schedule.reduce((s,t) => s + t.delay, 0) / schedule.length).toFixed(1));
  const onTime      = schedule.filter(t => t.delay === 0).length;
  const throughput  = parseFloat(((onTime / schedule.length) * 100).toFixed(1));
  const rewardScore = parseFloat((100 - avgDelay * 1.5 - conflicts.length * 3 + throughput * 0.5).toFixed(2));
  const prevBest    = history.length > 0 ? Math.max(...history.map(h => h.rewardScore)) : -Infinity;

  return {
    simId, schedule, conflicts, timestamp: new Date().toLocaleTimeString(),
    isBest: rewardScore > prevBest || history.length === 0,
    kpis: { rewardScore, avgDelay, maxThroughput: throughput, totalConflicts: conflicts.length,
             completionRate: parseFloat(((onTime/schedule.length)*100).toFixed(1)), onTime, delayed: schedule.length - onTime },
  };
}

// DESIGN TOKENS
const C = {
  navy:   "#0F172A", royal:  "#1E40AF", accent: "#3B82F6",
  bg:     "#F1F5F9", card:   "#FFFFFF",
  green:  "#16A34A", amber:  "#D97706", red:    "#DC2626",
  gray:   "#64748B", border: "#E2E8F0", muted:  "#94A3B8",
};

const STATUS_COLOR = {
  ON_TIME: C.green, MINOR_DELAY: C.amber, MAJOR_DELAY: C.red, REASSIGNABLE: C.navy,
};
const STATUS_LABEL = {
  ON_TIME: "On Time", MINOR_DELAY: "Minor Delay", MAJOR_DELAY: "Major Delay", REASSIGNABLE: "Reassignable",
};

// SHARED PRIMITIVES
const cardStyle = (extra = {}) => ({
  background: C.card, borderRadius: 16,
  boxShadow: "0 1px 4px rgba(15,23,42,.05), 0 4px 18px rgba(15,23,42,.07)",
  ...extra,
});

function Btn({ children, onClick, disabled, variant = "primary", size = "md", icon: Icon, fullWidth }) {
  const V = {
    primary: { bg: C.royal,  fg: "#fff",   border: "none" },
    dark:    { bg: C.navy,   fg: "#fff",   border: "none" },
    ghost:   { bg: "transparent", fg: C.gray, border: `1.5px solid ${C.border}` },
    danger:  { bg: C.red,    fg: "#fff",   border: "none" },
    success: { bg: C.green,  fg: "#fff",   border: "none" },
    warning: { bg: C.amber,  fg: "#fff",   border: "none" },
    subtle:  { bg: C.bg,     fg: C.navy,   border: `1px solid ${C.border}` },
  };
  const S = {
    sm: { p: "5px 12px",  fs: 11, is: 12 },
    md: { p: "8px 18px",  fs: 12, is: 14 },
    lg: { p: "13px 32px", fs: 14, is: 16 },
  };
  const v = V[variant]; const s = S[size];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: v.bg, color: v.fg, border: v.border,
      borderRadius: 9, padding: s.p, fontSize: s.fs, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
      display: "inline-flex", alignItems: "center", gap: 6,
      transition: "opacity .15s", width: fullWidth ? "100%" : undefined,
      justifyContent: "center", fontFamily: "inherit",
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = ".82"; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = "1"; }}>
      {Icon && <Icon size={s.is} />}{children}
    </button>
  );
}

function Badge({ children, color = C.accent }) {
  return (
    <span style={{ background: `${color}18`, color, borderRadius: 5, padding: "2px 8px",
      fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function SectionTitle({ children, icon: Icon, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {Icon && (
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.royal}12`,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={16} color={C.royal} />
          </div>
        )}
        <span style={{ fontWeight: 800, fontSize: 14, color: C.navy }}>{children}</span>
      </div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginLeft: 41 }}>{sub}</div>}
    </div>
  );
}

// KPI CARD
function KPICard({ label, value, unit = "", sub, color = C.royal, icon: Icon }) {
  return (
    <div style={{ ...cardStyle({ padding: "18px 22px", flex: 1, minWidth: 140, cursor: "default",
      transition: "transform .18s, box-shadow .18s" }) }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(15,23,42,.13)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.gray, letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}14`,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          {Icon && <Icon size={15} color={color} />}
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1, letterSpacing: -1 }}>
        {value}<span style={{ fontSize: 13, fontWeight: 500, color: C.gray, marginLeft: 3 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// TRAIN MAP
function TooltipRow({ icon: Icon, label, value, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 3 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#93C5FD", opacity: 0.75 }}>
        <Icon size={11} />{label}
      </span>
      <span style={{ fontWeight: 700, color: valueColor || "#fff", fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}

function TrainMap({ schedule, conflicts, filteredConflicts = null, searchTerm = '', selectedRegion = 'all' }) {
  const [tooltip, setTooltip] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Use filtered conflicts if provided, otherwise use all conflicts
  const displayConflicts = filteredConflicts || conflicts;
  const conflictIds = new Set(displayConflicts.flatMap(c => [c.train1Id, c.train2Id]));
  const stationMap  = Object.fromEntries(STATION_NODES.map(s => [s.id, s]));

  // Filter stations based on search and region
  const getStationRegion = (stationName) => {
    const northernStations = ['New Delhi', 'Lucknow', 'Jaipur', 'Chandigarh', 'Jammu Tawi', 'Amritsar', 'Haridwar', 'Dehradun', 'Shimla', 'Agra', 'Kanpur', 'Allahabad', 'Varanasi'];
    const westernStations = ['Mumbai Central', 'Pune', 'Goa Madgaon', 'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Mangaluru', 'Kochuveli'];
    const easternStations = ['Howrah', 'Kolkata', 'Bhubaneswar', 'Visakhapatnam', 'Ranchi', 'Jamshedpur', 'Patna', 'Guwahati', 'Dibrugarh'];
    const southernStations = ['Chennai Central', 'KSR Bengaluru', 'Hyderabad', 'Secunderabad', 'Madurai', 'Tirupati', 'Coimbatore', 'Thiruvananthapuram'];
    const centralStations = ['Bhopal', 'Nagpur', 'Indore', 'Raipur', 'Bilaspur'];
    
    if (northernStations.some(city => stationName.includes(city))) return 'north';
    if (westernStations.some(city => stationName.includes(city))) return 'west';
    if (easternStations.some(city => stationName.includes(city))) return 'east';
    if (southernStations.some(city => stationName.includes(city))) return 'south';
    if (centralStations.some(city => stationName.includes(city))) return 'central';
    return 'other';
  };

  // Filter stations based on search and region
  const shouldShowStation = (station) => {
    if (!searchTerm && selectedRegion === 'all') return true;
    
    // Check search term
    const matchesSearch = !searchTerm || 
      station.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check region
    const stationRegion = getStationRegion(station.name);
    const matchesRegion = selectedRegion === 'all' || stationRegion === selectedRegion;
    
    return matchesSearch && matchesRegion;
  };

  // Filter tracks based on search term
  const shouldHighlightTrack = (trackPath) => {
    if (!searchTerm) return false;
    return trackPath.track.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Filter trains based on search and region
  const shouldShowTrain = (train) => {
    if (!searchTerm && selectedRegion === 'all') return true;
    
    // Check search term
    const matchesSearch = !searchTerm || 
      train.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      train.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      train.destination.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check region
    const originRegion = getStationRegion(train.origin);
    const destRegion = getStationRegion(train.destination);
    const matchesRegion = selectedRegion === 'all' || originRegion === selectedRegion || destRegion === selectedRegion;
    
    return matchesSearch && matchesRegion;
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  // Handle pan functionality
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div style={{ 
      position: "relative", 
      width: "100%", 
      height: "100%", 
      background: `linear-gradient(135deg, #1e3a5f 0%, #1e293b 50%, #0f172a 100%)`,
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 10px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
    }}>
      
      {/* Zoom Controls */}
      <div style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: 8
      }}>
        <button
          onClick={handleZoomIn}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            fontSize: 18,
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
          onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            fontSize: 18,
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
          onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
        >
          −
        </button>
        <button
          onClick={handleReset}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            fontSize: 12,
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
          onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
        >
          ⟲
        </button>
      </div>

      {/* Enhanced Map Container */}
      <div 
        style={{
          width: "100%",
          height: "100%",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg 
          viewBox={`${-panX/zoomLevel} ${-panY/zoomLevel} ${700/zoomLevel} ${500/zoomLevel}`} 
          width="100%" 
          height="100%" 
          style={{ display: "block" }}
        >
        <defs>
          <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.6" />
          </pattern>
          <filter id="stationGlow">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width="700" height="500" fill="#F8FAFC" />
        <rect width="700" height="500" fill="url(#mapgrid)" />

        {/* Track lines */}
        {TRACK_PATHS.map((p, i) => {
          const f = stationMap[p.from], t = stationMap[p.to];
          const conflict = displayConflicts.some(c => c.track === p.track);
          const isHighlighted = shouldHighlightTrack(p);
          const showTrack = !searchTerm || isHighlighted || 
            (shouldShowStation(stationMap[p.from]) || shouldShowStation(stationMap[p.to]));
          
          if (!showTrack) return null;
          
          return (
            <g key={i}>
              <line x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                stroke={isHighlighted ? "#FBBF24" : conflict ? "#FCA5A5" : "#CBD5E1"}
                strokeWidth={isHighlighted ? 4 : conflict ? 3.5 : 2}
                strokeDasharray={isHighlighted ? "3 3" : conflict ? "9 5" : undefined}
                opacity={isHighlighted ? 1 : 0.9} />
              {isHighlighted && (
                <text x={(f.x + t.x) / 2} y={(f.y + t.y) / 2 - 5} 
                  textAnchor="middle" fontSize="9" fill="#F59E0B" fontWeight="700">
                  {p.track}
                </text>
              )}
            </g>
          );
        })}

        {/* Station nodes */}
        {STATION_NODES.map(s => {
          const showStation = shouldShowStation(s);
          if (!showStation) return null;
          
          const stationRegion = getStationRegion(s.name);
          const isFiltered = searchTerm || selectedRegion !== 'all';
          
          return (
            <g key={s.id}>
              <circle cx={s.x} cy={s.y} r={isFiltered ? 14 : 12} 
                fill={isFiltered ? "#F59E0B" : C.royal} 
                stroke="#fff" strokeWidth={2.5} 
                filter={isFiltered ? "url(#stationGlow)" : undefined} />
              <circle cx={s.x} cy={s.y} r={isFiltered ? 6 : 5} fill="#fff" />
              <text x={s.x} y={s.y + (isFiltered ? 26 : 24)} 
                textAnchor="middle" 
                fontSize={isFiltered ? "9.5" : "8.5"} 
                fill={isFiltered ? "#F59E0B" : C.navy}
                fontWeight="700" fontFamily="monospace">
                {s.name}
              </text>
              {isFiltered && (
                <text x={s.x} y={s.y - 20} 
                  textAnchor="middle" fontSize="8" fill="#DC2626" fontWeight="700">
                  {stationRegion.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}

        {/* Train markers */}
        {schedule.filter(train => shouldShowTrain(train)).map(train => {
          const color      = STATUS_COLOR[train.statusCode];
          const inConflict = conflictIds.has(train.id);
          return (
            <g key={train.id} style={{ cursor: "pointer" }}
              onMouseEnter={() => setTooltip(train)}
              onMouseLeave={() => setTooltip(null)}>
              {inConflict && (
                <circle cx={train.posX} cy={train.posY} r={14} fill="none" stroke={C.red} strokeWidth={2} opacity={0.5}>
                  <animate attributeName="r"       values="12;19;12" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
              <rect x={train.posX - 11} y={train.posY - 7} width={22} height={14} rx={4}
                fill={color} stroke="#fff" strokeWidth={1.5} />
              <text x={train.posX} y={train.posY + 4} textAnchor="middle"
                fontSize="7" fill="#fff" fontWeight="900" fontFamily="monospace">{train.id}</text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {tooltip && (
        <div style={{ position: "absolute", bottom: 16, left: 16, background: C.navy, color: "#fff",
          borderRadius: 12, padding: "13px 18px", fontSize: 12, pointerEvents: "none",
          maxWidth: 240, boxShadow: "0 8px 28px rgba(0,0,0,.35)", zIndex: 10, fontFamily: "inherit" }}>
          <div style={{ fontWeight: 800, color: "#93C5FD", fontSize: 13, marginBottom: 10,
            display: "flex", alignItems: "center", gap: 7, borderBottom: "1px solid #1E3A5F", paddingBottom: 8 }}>
            <Train size={13} />{tooltip.name}
          </div>
          <TooltipRow icon={FileText}    label="Number"   value={`#${tooltip.number}`} />
          <TooltipRow icon={GitBranch}   label="Track"    value={tooltip.track} />
          <TooltipRow icon={Clock}       label="Delay"
            value={tooltip.delay > 0 ? `+${tooltip.delay} min` : "On Time"}
            valueColor={tooltip.delay > 0 ? "#FCA5A5" : "#86EFAC"} />
          <TooltipRow icon={Zap}         label="Priority" value={tooltip.priority} />
          <div style={{ marginTop: 8, color: C.muted, fontSize: 10, display: "flex", alignItems: "center", gap: 5 }}>
            <Navigation size={10} />{tooltip.origin} → {tooltip.destination}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,.96)",
        borderRadius: 11, padding: "10px 14px", fontSize: 11,
        boxShadow: "0 2px 12px rgba(0,0,0,.09)", border: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 10, color: C.gray,
          textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 5 }}>
          <Layers size={10} />Legend
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Object.entries(STATUS_COLOR).map(([status, color]) => (
            <div key={status} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
              <span style={{ fontSize: 10, color: C.navy, fontWeight: 600 }}>{STATUS_LABEL[status]}</span>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

// ENHANCED AI SUGGESTIONS
function AISuggestions({ conflicts, onAccept, onReject, onModify, userRole, onFilteredConflictsUpdate, onSearchUpdate, initialSearchTerm = '', initialSelectedRegion = 'all' }) {
  const [acceptedSuggestions, setAcceptedSuggestions] = useState([]);
  const [rejectedSuggestions, setRejectedSuggestions] = useState([]);
  const [modifyingConflict, setModifyingConflict] = useState(null);
  const [customTrack, setCustomTrack] = useState('');
  const [selectedTrain, setSelectedTrain] = useState('');
  const [availableTracks, setAvailableTracks] = useState([]);
  const [suggestionHistory, setSuggestionHistory] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedRegion, setSelectedRegion] = useState(initialSelectedRegion);
  const [filteredConflicts, setFilteredConflicts] = useState([]);

  // Get available tracks for suggestions
  useEffect(() => {
    setAvailableTracks(TRACKS); // Use the comprehensive TRACKS array
  }, []);

  // Regional classification and filtering
  const getTrainRegion = (trainName) => {
    const northernTrains = ['Delhi', 'Lucknow', 'Jaipur', 'Chandigarh', 'Jammu', 'Amritsar', 'Haridwar', 'Dehradun', 'Shimla', 'Agra', 'Kanpur', 'Allahabad', 'Varanasi'];
    const westernTrains = ['Mumbai', 'Pune', 'Goa', 'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Mangaluru', 'Kochuveli'];
    const easternTrains = ['Howrah', 'Kolkata', 'Bhubaneswar', 'Visakhapatnam', 'Ranchi', 'Jamshedpur', 'Patna', 'Guwahati', 'Dibrugarh'];
    const southernTrains = ['Chennai', 'Bengaluru', 'Hyderabad', 'Secunderabad', 'Madurai', 'Tirupati', 'Coimbatore', 'Thiruvananthapuram'];
    const centralTrains = ['Bhopal', 'Nagpur', 'Indore', 'Raipur', 'Bilaspur', 'Jabalpur', 'Itarsi'];
    
    if (northernTrains.some(city => trainName.includes(city))) return 'north';
    if (westernTrains.some(city => trainName.includes(city))) return 'west';
    if (easternTrains.some(city => trainName.includes(city))) return 'east';
    if (southernTrains.some(city => trainName.includes(city))) return 'south';
    if (centralTrains.some(city => trainName.includes(city))) return 'central';
    return 'other';
  };

  // Filter conflicts based on search and region
  useEffect(() => {
    let filtered = conflicts;
    
    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(conflict => 
        conflict.train1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conflict.train2.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conflict.track.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conflict.suggestion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by region
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(conflict => {
        const train1Region = getTrainRegion(conflict.train1);
        const train2Region = getTrainRegion(conflict.train2);
        return train1Region === selectedRegion || train2Region === selectedRegion;
      });
    }
    
    setFilteredConflicts(filtered);
    
    // Update parent component with filtered conflicts
    if (onFilteredConflictsUpdate) {
      onFilteredConflictsUpdate(filtered);
    }
  }, [conflicts, searchTerm, selectedRegion, onFilteredConflictsUpdate]);

  // Sync search parameters with parent component
  useEffect(() => {
    if (onSearchUpdate) {
      onSearchUpdate(searchTerm, selectedRegion);
    }
  }, [searchTerm, selectedRegion, onSearchUpdate]);

  // Update local state when initial props change (only if different to avoid glitches)
  useEffect(() => {
    if (initialSearchTerm !== searchTerm) {
      setSearchTerm(initialSearchTerm);
    }
    if (initialSelectedRegion !== selectedRegion) {
      setSelectedRegion(initialSelectedRegion);
    }
  }, [initialSearchTerm, initialSelectedRegion, searchTerm, selectedRegion]);

  const handleAccept = (conflict) => {
    setAcceptedSuggestions(prev => [...prev, conflict.id]);
    setSuggestionHistory(prev => [...prev, { action: 'accept', conflict, timestamp: new Date() }]);
    onAccept(conflict);
  };

  const handleReject = (conflict) => {
    setRejectedSuggestions(prev => [...prev, conflict.id]);
    setSuggestionHistory(prev => [...prev, { action: 'reject', conflict, timestamp: new Date() }]);
    onReject(conflict);
  };

  // Bulk acceptance functionality for operators
  const handleAcceptAll = () => {
    const unhandledConflicts = conflicts.filter(c => 
      !acceptedSuggestions.includes(c.id) && !rejectedSuggestions.includes(c.id)
    );
    
    unhandledConflicts.forEach(conflict => {
      setAcceptedSuggestions(prev => [...prev, conflict.id]);
      setSuggestionHistory(prev => [...prev, { action: 'accept', conflict, timestamp: new Date() }]);
      onAccept(conflict);
    });
  };

  const acceptHighPriority = () => {
    const highPriorityConflicts = conflicts.filter(c => 
      !acceptedSuggestions.includes(c.id) && 
      !rejectedSuggestions.includes(c.id) &&
      (c.priority === 'HIGH' || (c.delayReduction && c.delayReduction > 15))
    );
    
    highPriorityConflicts.forEach(conflict => {
      setAcceptedSuggestions(prev => [...prev, conflict.id]);
      setSuggestionHistory(prev => [...prev, { action: 'accept', conflict, timestamp: new Date() }]);
      onAccept(conflict);
    });
  };

  const acceptByImpact = (minImpact) => {
    const highImpactConflicts = conflicts.filter(c => {
      if (acceptedSuggestions.includes(c.id) || rejectedSuggestions.includes(c.id)) return false;
      const impactScore = Math.round((c.delayReduction / 30) * 40 + (c.throughputGain / 20) * 60);
      return impactScore >= minImpact;
    });
    
    highImpactConflicts.forEach(conflict => {
      setAcceptedSuggestions(prev => [...prev, conflict.id]);
      setSuggestionHistory(prev => [...prev, { action: 'accept', conflict, timestamp: new Date() }]);
      onAccept(conflict);
    });
  };

  const handleModify = (conflict) => {
    setModifyingConflict(conflict.id);
    setCustomTrack('');
    setSelectedTrain(conflict.train2);
  };

  const handleCustomReassign = (conflict) => {
    if (customTrack.trim()) {
      const modifiedConflict = {
        ...conflict,
        suggestion: `Reassign ${selectedTrain} to ${customTrack.trim()}`,
        customModification: true,
        modifiedBy: userRole,
        timestamp: new Date(),
        delayReduction: Math.floor(Math.random() * 15 + 10),
        throughputGain: parseFloat((Math.random() * 8 + 5).toFixed(1)),
        originalSuggestion: conflict.suggestion
      };
      
      setAcceptedSuggestions(prev => [...prev, conflict.id]);
      setSuggestionHistory(prev => [...prev, { 
        action: 'modify', 
        conflict: modifiedConflict, 
        originalConflict: conflict,
        timestamp: new Date() 
      }]);
      onModify(modifiedConflict);
      setModifyingConflict(null);
      setCustomTrack('');
      setSelectedTrain('');
    }
  };

  const handleQuickAssign = (conflict, track) => {
    const quickConflict = {
      ...conflict,
      suggestion: `Reassign ${conflict.train2} to ${track}`,
      customModification: true,
      modifiedBy: userRole,
      quickAssign: true,
      delayReduction: Math.floor(Math.random() * 12 + 8),
      throughputGain: parseFloat((Math.random() * 6 + 4).toFixed(1))
    };
    
    setAcceptedSuggestions(prev => [...prev, conflict.id]);
    setSuggestionHistory(prev => [...prev, { 
      action: 'quick_assign', 
      conflict: quickConflict, 
      originalConflict: conflict,
      timestamp: new Date() 
    }]);
    onModify(quickConflict);
  };

  const cancelModify = () => {
    setModifyingConflict(null);
    setCustomTrack('');
    setSelectedTrain('');
  };

  const revertSuggestion = (historyItem) => {
    if (historyItem.action === 'modify' || historyItem.action === 'quick_assign') {
      // Revert to original suggestion
      const revertConflict = historyItem.originalConflict;
      handleAccept(revertConflict);
    }
  };

  const getImpactScore = (conflict) => {
    const delayWeight = 0.4;
    const throughputWeight = 0.6;
    const normalizedDelay = Math.min(conflict.delayReduction / 30, 1) * 100;
    const normalizedThroughput = Math.min(conflict.throughputGain / 20, 1) * 100;
    return Math.round(normalizedDelay * delayWeight + normalizedThroughput * throughputWeight);
  };

  const getPriorityColor = (score) => {
    if (score >= 80) return C.green;
    if (score >= 60) return C.amber;
    return C.red;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header with controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: C.card, borderRadius: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>
            AI Conflict Resolution
          </span>
          <Badge color={conflicts.length > 0 ? C.red : C.green}>
            {conflicts.length} Active
          </Badge>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: showAdvanced ? C.royal : "transparent",
              color: showAdvanced ? "#fff" : C.gray,
              border: `1px solid ${showAdvanced ? C.royal : C.border}`,
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 10,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {showAdvanced ? "Simple" : "Advanced"}
          </button>
        </div>
      </div>

      {/* Bulk Actions and Search Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 16px", background: C.card, borderRadius: 8 }}>
        {/* Search and Filter Controls */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            placeholder="🔍 Search trains, tracks, or suggestions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 11,
              background: C.bg
            }}
          />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{
              padding: "8px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 11,
              background: C.bg,
              minWidth: 100,
              color: "#000000"
            }}
          >
            <option value="all" style={{ color: "#000000" }}>All Regions</option>
            <option value="north" style={{ color: "#000000" }}>North</option>
            <option value="west" style={{ color: "#000000" }}>West</option>
            <option value="east" style={{ color: "#000000" }}>East</option>
            <option value="south" style={{ color: "#000000" }}>South</option>
            <option value="central" style={{ color: "#000000" }}>Central</option>
          </select>
        </div>

        {/* Bulk Action Controls */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={handleAcceptAll}
            disabled={conflicts.filter(c => !acceptedSuggestions.includes(c.id) && !rejectedSuggestions.includes(c.id)).length === 0}
            style={{
              background: C.green,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              opacity: conflicts.filter(c => !acceptedSuggestions.includes(c.id) && !rejectedSuggestions.includes(c.id)).length === 0 ? 0.5 : 1,
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <Zap size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Accept All ({conflicts.filter(c => !acceptedSuggestions.includes(c.id) && !rejectedSuggestions.includes(c.id)).length})
          </button>
          
          <button
            onClick={acceptHighPriority}
            disabled={conflicts.filter(c => !acceptedSuggestions.includes(c.id) && !rejectedSuggestions.includes(c.id) && (c.priority === 'HIGH' || (c.delayReduction && c.delayReduction > 15))).length === 0}
            style={{
              background: C.royal,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              opacity: conflicts.filter(c => !acceptedSuggestions.includes(c.id) && !rejectedSuggestions.includes(c.id) && (c.priority === 'HIGH' || (c.delayReduction && c.delayReduction > 15))).length === 0 ? 0.5 : 1,
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <Target size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> High Priority ({conflicts.filter(c => !acceptedSuggestions.includes(c.id) && !rejectedSuggestions.includes(c.id) && (c.priority === 'HIGH' || (c.delayReduction && c.delayReduction > 15))).length})
          </button>
          
          <button
            onClick={() => acceptByImpact(80)}
            disabled={conflicts.filter(c => {
              if (acceptedSuggestions.includes(c.id) || rejectedSuggestions.includes(c.id)) return false;
              const impactScore = Math.round((c.delayReduction / 30) * 40 + (c.throughputGain / 20) * 60);
              return impactScore >= 80;
            }).length === 0}
            style={{
              background: C.amber,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              opacity: conflicts.filter(c => {
                if (acceptedSuggestions.includes(c.id) || rejectedSuggestions.includes(c.id)) return false;
                const impactScore = Math.round((c.delayReduction / 30) * 40 + (c.throughputGain / 20) * 60);
                return impactScore >= 80;
              }).length === 0 ? 0.5 : 1,
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <BarChart3 size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> High Impact (80%+) ({conflicts.filter(c => {
              if (acceptedSuggestions.includes(c.id) || rejectedSuggestions.includes(c.id)) return false;
              const impactScore = Math.round((c.delayReduction / 30) * 40 + (c.throughputGain / 20) * 60);
              return impactScore >= 80;
            }).length})
          </button>
        </div>

        {/* Filter Summary */}
        {searchTerm || selectedRegion !== 'all' ? (
          <div style={{ fontSize: 10, color: C.muted }}>
            Showing {filteredConflicts.length} of {conflicts.length} conflicts
            {searchTerm && ` matching "${searchTerm}"`}
            {selectedRegion !== 'all' && ` in ${selectedRegion} region`}
          </div>
        ) : null}
      </div>

      {filteredConflicts.length === 0 ? (
        <div style={{ textAlign: "center", color: C.gray, padding: "24px 16px" }}>
          <CheckCircle size={32} color={C.green} style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>
            {conflicts.length === 0 ? "No conflicts detected" : "No conflicts match your filters"}
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
            {conflicts.length === 0 ? "All trains running smoothly" : "Try adjusting your search or region filter"}
          </div>
        </div>
      ) : (
        filteredConflicts.map(conflict => {
          const isAccepted = acceptedSuggestions.includes(conflict.id);
          const isRejected = rejectedSuggestions.includes(conflict.id);
          const isModifying = modifyingConflict === conflict.id;
          const impactScore = getImpactScore(conflict);
          const priorityColor = getPriorityColor(impactScore);
          
          return (
            <div 
              key={conflict.id} 
              style={{ 
                background: isAccepted ? `${C.green}05` : isRejected ? `${C.red}05` : isModifying ? `${C.royal}05` : C.bg, 
                borderRadius: 10, 
                padding: "16px",
                border: `1px solid ${isAccepted ? C.green : isRejected ? C.red : isModifying ? C.royal : C.border}`, 
                transition: "all .2s",
                opacity: isAccepted || isRejected ? 0.7 : 1,
                position: "relative"
              }}
              onMouseEnter={e => { 
                if (!isAccepted && !isRejected && !isModifying) {
                  e.currentTarget.style.transform = "translateY(-2px)"; 
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.08)"; 
                }
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.transform = ""; 
                e.currentTarget.style.boxShadow = ""; 
              }}
            >
              {/* Priority indicator */}
              <div style={{
                position: "absolute",
                top: -8,
                right: 12,
                background: priorityColor,
                color: "#fff",
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 9,
                fontWeight: 700
              }}>
                {impactScore}% Impact
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
                    {conflict.train1} / {conflict.train2}
                  </div>
                  <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.5 }}>
                    Both assigned to <span style={{ fontFamily: "monospace", color: C.royal, fontWeight: 600 }}>{conflict.track}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge color={C.red}>Conflict</Badge>
                  {isAccepted && <><CheckCircle size={10} style={{ marginRight: 2, verticalAlign: 'middle' }} /> Applied</>}
                  {isRejected && <><X size={10} style={{ marginRight: 2, verticalAlign: 'middle' }} /> Rejected</>}
                  {isModifying && <><Edit size={10} style={{ marginRight: 2, verticalAlign: 'middle' }} /> Editing</>}
                </div>
              </div>
              
              {!isModifying ? (
                <>
                  {/* AI Suggestion */}
                  <div style={{ background: C.card, borderRadius: 8, padding: "12px", marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.navy }}>AI Suggestion</div>
                      <div style={{ fontSize: 9, color: C.muted }}>
                        Confidence: {Math.floor(Math.random() * 20 + 75)}%
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.6, marginBottom: 8 }}>
                      {conflict.suggestion}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 9, color: C.muted }}>
                      <span><TrendingDown size={10} style={{ marginRight: 2, verticalAlign: 'middle' }} /> Delay: -{conflict.delayReduction} min</span>
                      <span><TrendingUp size={10} style={{ marginRight: 2, verticalAlign: 'middle' }} /> Throughput: +{conflict.throughputGain}%</span>
                      <span><Trophy size={10} style={{ marginRight: 2, verticalAlign: 'middle' }} /> Score: +{Math.floor(conflict.delayReduction * 0.5 + conflict.throughputGain * 0.8)}</span>
                    </div>
                  </div>

                  {/* Quick Assign Options */}
                  {showAdvanced && (
                    <div style={{ background: `${C.accent}05`, borderRadius: 8, padding: "12px", marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, marginBottom: 8 }}>Quick Assign</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {availableTracks.slice(0, 4).map(track => (
                          <button
                            key={track}
                            onClick={() => handleQuickAssign(conflict, track)}
                            style={{
                              background: C.card,
                              border: `1px solid ${C.border}`,
                              borderRadius: 4,
                              padding: "4px 8px",
                              fontSize: 9,
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = C.royal;
                              e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = C.card;
                              e.currentTarget.style.color = C.gray;
                            }}
                          >
                            {track}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Custom Assignment Interface */
                <div style={{ background: `${C.royal}05`, borderRadius: 8, padding: "12px", marginBottom: 12, border: `1px solid ${C.royal}30` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.royal, marginBottom: 8 }}><Edit size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Custom Assignment</div>
                  
                  {/* Train Selection */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 9, color: C.gray, marginBottom: 4 }}>Train to reassign:</div>
                    <select
                      value={selectedTrain}
                      onChange={(e) => setSelectedTrain(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        border: `1px solid ${C.border}`,
                        borderRadius: 4,
                        fontSize: 10,
                        background: C.card,
                        color: C.navy
                      }}
                    >
                      <option value={conflict.train1}>{conflict.train1}</option>
                      <option value={conflict.train2}>{conflict.train2}</option>
                    </select>
                  </div>

                  {/* Track Input */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 9, color: C.gray, marginBottom: 4 }}>Assign to track:</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        value={customTrack}
                        onChange={(e) => setCustomTrack(e.target.value)}
                        placeholder="e.g., Track-3"
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          border: `1px solid ${C.border}`,
                          borderRadius: 4,
                          fontSize: 10,
                          fontFamily: "monospace",
                          background: C.card,
                          color: C.navy
                        }}
                        autoFocus
                      />
                      <select
                        onChange={(e) => setCustomTrack(e.target.value)}
                        style={{
                          padding: "6px 8px",
                          border: `1px solid ${C.border}`,
                          borderRadius: 4,
                          fontSize: 10,
                          background: C.card,
                          color: C.navy
                        }}
                      >
                        <option value="">Select...</option>
                        {availableTracks.map(track => (
                          <option key={track} value={track}>{track}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ fontSize: 9, color: C.muted }}>
                    💡 Tip: Choose from dropdown or type custom track name
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              {!isAccepted && !isRejected && (
                <div style={{ display: "flex", gap: 8 }}>
                  {!isModifying ? (
                    <>
                      <Btn 
                        variant="success" 
                        size="sm" 
                        icon={CheckCircle} 
                        onClick={() => handleAccept(conflict)}
                        style={{ flex: 1 }}
                      >
                        Accept
                      </Btn>
                      <Btn 
                        variant="ghost" 
                        size="sm" 
                        icon={X} 
                        onClick={() => handleReject(conflict)}
                        style={{ flex: 1 }}
                      >
                        Reject
                      </Btn>
                      <Btn 
                        variant="primary" 
                        size="sm" 
                        icon={Edit} 
                        onClick={() => handleModify(conflict)}
                        style={{ flex: 1 }}
                      >
                        Modify
                      </Btn>
                    </>
                  ) : (
                    <>
                      <Btn 
                        variant="success" 
                        size="sm" 
                        icon={CheckCircle} 
                        onClick={() => handleCustomReassign(conflict)}
                        disabled={!customTrack.trim()}
                        style={{ flex: 1 }}
                      >
                        Apply
                      </Btn>
                      <Btn 
                        variant="ghost" 
                        size="sm" 
                        icon={X} 
                        onClick={cancelModify}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </Btn>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Advanced Features Summary */}
      {showAdvanced && suggestionHistory.length > 0 && (
        <div style={{ background: C.card, borderRadius: 8, padding: "12px", marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Recent Actions</div>
          <div style={{ fontSize: 9, color: C.gray }}>
            {suggestionHistory.slice(-3).map((item, index) => (
              <div key={index} style={{ marginBottom: 4 }}>
                {item.action === 'accept' && <><CheckCircle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Accepted suggestion</>}
                {item.action === 'reject' && <><X size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Rejected suggestion</>}
                {item.action === 'modify' && <><Edit size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Modified assignment</>}
                {item.action === 'quick_assign' && <><Zap size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Quick assigned</>}
                <span style={{ marginLeft: 8, color: C.muted }}>
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// SCHEDULE TABLE
function ScheduleTable({ schedule }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Train</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Number</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Origin</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Destination</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Priority</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Track</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Start</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>End</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Delay</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map(train => (
            <tr key={train.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background .2s" }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <td style={{ padding: "10px 12px", fontWeight: 600, color: C.navy }}>{train.name}</td>
              <td style={{ padding: "10px 12px", fontFamily: "monospace", color: C.gray }}>#{train.number}</td>
              <td style={{ padding: "10px 12px", color: C.gray }}>{train.origin}</td>
              <td style={{ padding: "10px 12px", color: C.gray }}>{train.destination}</td>
              <td style={{ padding: "10px 12px" }}>
                <Badge color={train.priority === "HIGH" ? C.red : train.priority === "MEDIUM" ? C.amber : C.green}>
                  {train.priority}
                </Badge>
              </td>
              <td style={{ padding: "10px 12px", fontFamily: "monospace", color: C.royal, fontWeight: 600 }}>{train.track}</td>
              <td style={{ padding: "10px 12px", fontFamily: "monospace", color: C.gray }}>{train.startTime}</td>
              <td style={{ padding: "10px 12px", fontFamily: "monospace", color: C.gray }}>{train.endTime}</td>
              <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, 
                color: train.delay > 0 ? C.red : C.green }}>
                {train.delay > 0 ? `+${train.delay}` : "0"} min
              </td>
              <td style={{ padding: "10px 12px" }}>
                <Badge color={STATUS_COLOR[train.statusCode]}>
                  {STATUS_LABEL[train.statusCode]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ENHANCED ANALYTICS
function Analytics({ history, userRole }) {
  const [analytics, setAnalytics] = useState(null);
  const [bestSimulations, setBestSimulations] = useState([]);
  const [userSimulations, setUserSimulations] = useState([]);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'week', 'month'
  const [analyticsView, setAnalyticsView] = useState('overview'); // 'overview', 'trends', 'comparison', 'insights'

  useEffect(() => {
    // Load analytics data
    const analyticsData = simulationStorage.getAnalytics();
    setAnalytics(analyticsData);
    
    // Load best simulations
    const best = simulationStorage.getBestSimulations(10);
    setBestSimulations(best);
    
    // Load user-specific simulations
    const userSims = simulationStorage.getUserSimulations();
    setUserSimulations(userSims);
  }, []);

  // Get filtered data based on time range
  const getFilteredData = () => {
    const allSims = simulationStorage.getAllSimulations();
    const now = new Date();
    
    switch (timeRange) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return allSims.filter(sim => new Date(sim.timestamp) >= weekAgo);
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return allSims.filter(sim => new Date(sim.timestamp) >= monthAgo);
      default:
        return allSims;
    }
  };

  const filteredData = getFilteredData();
  const chartData = filteredData.slice(0, 20).reverse().map((sim, i) => ({
    run: i + 1,
    rewardScore: sim.kpis?.rewardScore || 0,
    throughput: sim.kpis?.maxThroughput || 0,
    conflicts: sim.kpis?.totalConflicts || 0,
    avgDelay: sim.kpis?.avgDelay || 0,
    role: sim.sessionInfo?.role || 'unknown',
    date: new Date(sim.timestamp).toLocaleDateString(),
    efficiency: sim.kpis?.completionRate || 0,
    onTime: sim.kpis?.onTime || 0,
    delayed: sim.kpis?.delayed || 0,
  }));

  // Advanced performance calculations
  const calculatePerformanceMetrics = (sims) => {
    if (sims.length === 0) return {
      trend: 'stable',
      improvement: 0,
      consistency: 0,
      peakPerformance: 0,
      averagePerformance: 0,
      volatility: 0
    };

    const scores = sims.map(s => s.kpis?.rewardScore || 0);
    const recentScores = scores.slice(0, 10);
    const olderScores = scores.slice(10, 20);
    
    // Calculate trend
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.length > 0 ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length : recentAvg;
    const trend = recentAvg > olderAvg * 1.05 ? 'improving' : 
                 recentAvg < olderAvg * 0.95 ? 'declining' : 'stable';
    
    // Calculate improvement percentage
    const improvement = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg * 100) : 0;
    
    // Calculate consistency (inverse of standard deviation)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    const consistency = mean > 0 ? Math.max(0, 1 - (stdDev / mean)) : 0;
    
    // Calculate volatility (coefficient of variation)
    const volatility = mean > 0 ? (stdDev / mean) : 0;
    
    return {
      trend,
      improvement,
      consistency,
      peakPerformance: Math.max(...scores),
      averagePerformance: mean,
      volatility
    };
  };

  const performanceMetrics = calculatePerformanceMetrics(filteredData);

  // Calculate efficiency metrics
  const calculateEfficiencyMetrics = (sims) => {
    if (sims.length === 0) return {
      networkEfficiency: 0,
      resourceUtilization: 0,
      conflictResolution: 0,
      delayManagement: 0
    };

    const totalTrains = sims.reduce((sum, sim) => sum + (sim.schedule?.length || 0), 0);
    const totalOnTime = sims.reduce((sum, sim) => sum + (sim.kpis?.onTime || 0), 0);
    const totalConflicts = sims.reduce((sum, sim) => sum + (sim.kpis?.totalConflicts || 0), 0);
    const totalDelay = sims.reduce((sum, sim) => sum + (sim.kpis?.avgDelay || 0), 0);
    
    return {
      networkEfficiency: (totalOnTime / totalTrains * 100) || 0,
      resourceUtilization: Math.min(100, (totalTrains / (sims.length * 10) * 100)) || 0,
      conflictResolution: Math.max(0, 100 - (totalConflicts / sims.length * 20)) || 0,
      delayManagement: Math.max(0, 100 - (totalDelay / sims.length * 10)) || 0
    };
  };

  const efficiencyMetrics = calculateEfficiencyMetrics(filteredData);

  // Calculate role-specific stats
  const getRoleStats = () => {
    if (!analytics) return {};
    
    return {
      admin: analytics.roleStats?.admin || { count: 0, bestScore: 0 },
      operator: analytics.roleStats?.operator || { count: 0, bestScore: 0 },
      analyst: analytics.roleStats?.analyst || { count: 0, bestScore: 0 }
    };
  };

  const roleStats = getRoleStats();

  // Generate insights
  const generateInsights = () => {
    const insights = [];
    
    // Performance trend insight
    if (performanceMetrics.trend === 'improving') {
      insights.push({
        type: 'positive',
        icon: <TrendingUp size={16} />,
        title: 'Performance Improving',
        description: `Recent simulations show ${performanceMetrics.improvement.toFixed(1)}% improvement in reward scores.`
      });
    } else if (performanceMetrics.trend === 'declining') {
      insights.push({
        type: 'warning',
        icon: <TrendingDown size={16} />,
        title: 'Performance Declining',
        description: `Recent simulations show ${Math.abs(performanceMetrics.improvement).toFixed(1)}% decline in reward scores.`
      });
    }

    // Consistency insight
    if (performanceMetrics.consistency > 0.8) {
      insights.push({
        type: 'positive',
        icon: <Target size={16} />,
        title: 'High Consistency',
        description: 'Performance is very consistent with low volatility.'
      });
    } else if (performanceMetrics.consistency < 0.5) {
      insights.push({
        type: 'warning',
        icon: <AlertTriangle size={16} />,
        title: 'Inconsistent Performance',
        description: 'High volatility in performance scores. Consider reviewing simulation parameters.'
      });
    }

    // Efficiency insight
    if (efficiencyMetrics.networkEfficiency > 85) {
      insights.push({
        type: 'positive',
        icon: <Zap size={16} />,
        title: 'Excellent Network Efficiency',
        description: `${efficiencyMetrics.networkEfficiency.toFixed(1)}% of trains running on time.`
      });
    }

    // Role performance insight
    const bestRole = Object.entries(roleStats).reduce((best, [role, stats]) => 
      stats.bestScore > best.score ? { role, score: stats.bestScore } : best, 
      { role: 'none', score: 0 }
    );
    
    if (bestRole.role !== 'none') {
      insights.push({
        type: 'info',
        icon: '👥',
        title: 'Best Performing Role',
        description: `${bestRole.role.charAt(0).toUpperCase() + bestRole.role.slice(1)} role achieved highest score of ${bestRole.score.toFixed(1)}.`
      });
    }

    return insights;
  };

  const insights = generateInsights();

  // Export data function
  const handleExport = () => {
    simulationStorage.exportData();
  };

  // Clear old data function
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear old simulation data? This will keep only the most recent 500 simulations.')) {
      simulationStorage.clearOldData(500);
      // Reload data
      const analyticsData = simulationStorage.getAnalytics();
      setAnalytics(analyticsData);
      const best = simulationStorage.getBestSimulations(10);
      setBestSimulations(best);
      const userSims = simulationStorage.getUserSimulations();
      setUserSimulations(userSims);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Analytics Header */}
      <div style={cardStyle({ padding: "20px" })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <SectionTitle icon={BarChart3} sub={`${filteredData.length} simulations analyzed`}>
            Advanced Performance Analytics
          </SectionTitle>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select 
              value={analyticsView} 
              onChange={(e) => setAnalyticsView(e.target.value)}
              style={{
                padding: "6px 12px", 
                border: `1px solid ${C.border}`, 
                borderRadius: 6, 
                fontSize: 12,
                background: C.card,
                color: C.text,
                marginRight: 10
              }}
            >
              <option value="overview" style={{ color: C.text }}>Overview</option>
              <option value="comparison" style={{ color: C.text }}>Comparison</option>
              <option value="insights" style={{ color: C.text }}>Insights</option>
            </select>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                padding: "6px 12px", 
                border: `1px solid ${C.border}`, 
                borderRadius: 6, 
                fontSize: 12,
                background: C.card,
                color: C.text
              }}
            >
              <option value="all" style={{ color: C.text }}>All Time</option>
              <option value="week" style={{ color: C.text }}>Last Week</option>
              <option value="month" style={{ color: C.text }}>Last Month</option>
            </select>
            {userRole === 'admin' && (
              <>
                <Btn variant="ghost" size="sm" icon={Download} onClick={handleExport}>Export</Btn>
                <Btn variant="ghost" size="sm" icon={RotateCcw} onClick={handleClearData}>Clear Old</Btn>
              </>
            )}
          </div>
        </div>

        {/* Performance Metrics Overview */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
          <div style={cardStyle({ padding: "16px", background: `${C.royal}10` })}>
            <div style={{ fontSize: 11, color: C.royal, fontWeight: 700, marginBottom: 6 }}>
              Total Simulations
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.royal }}>
              {analytics?.totalSimulations || 0}
            </div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
              Across all roles
            </div>
          </div>
          
          <div style={cardStyle({ padding: "16px", background: `${C.green}10` })}>
            <div style={{ fontSize: 11, color: C.green, fontWeight: 700, marginBottom: 6 }}>
              Best Score
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.green }}>
              {(analytics?.bestScore || 0).toFixed(1)}
            </div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
              Peak performance
            </div>
          </div>
          
          <div style={cardStyle({ padding: "16px", background: `${C.amber}10` })}>
            <div style={{ fontSize: 11, color: C.amber, fontWeight: 700, marginBottom: 6 }}>
              Avg Throughput
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.amber }}>
              {(analytics?.averageThroughput || 0).toFixed(1)}%
            </div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
              On-time performance
            </div>
          </div>
          
          <div style={cardStyle({ padding: "16px", background: `${C.red}10` })}>
            <div style={{ fontSize: 11, color: C.red, fontWeight: 700, marginBottom: 6 }}>
              Avg Conflicts
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.red }}>
              {(analytics?.averageConflicts || 0).toFixed(1)}
            </div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
              Per simulation
            </div>
          </div>

          {/* Advanced Performance Metrics */}
          <div style={cardStyle({ padding: "16px", background: `${performanceMetrics.trend === 'improving' ? C.green : performanceMetrics.trend === 'declining' ? C.red : C.royal}10` })}>
            <div style={{ fontSize: 11, color: performanceMetrics.trend === 'improving' ? C.green : performanceMetrics.trend === 'declining' ? C.red : C.royal, fontWeight: 700, marginBottom: 6 }}>
              Performance Trend
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: performanceMetrics.trend === 'improving' ? C.green : performanceMetrics.trend === 'declining' ? C.red : C.royal }}>
              {performanceMetrics.trend === 'improving' ? <TrendingUp size={24} style={{ verticalAlign: 'middle' }} /> : performanceMetrics.trend === 'declining' ? <TrendingDown size={24} style={{ verticalAlign: 'middle' }} /> : <Activity size={24} style={{ verticalAlign: 'middle' }} />}
            </div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
              {performanceMetrics.trend.charAt(0).toUpperCase() + performanceMetrics.trend.slice(1)}
            </div>
          </div>

          <div style={cardStyle({ padding: "16px", background: `${C.accent}10` })}>
            <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginBottom: 6 }}>
              Consistency
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.accent }}>
              {(performanceMetrics.consistency * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
              Performance stability
            </div>
          </div>

          <div style={cardStyle({ padding: "16px", background: `${C.royal}10` })}>
            <div style={{ fontSize: 11, color: C.royal, fontWeight: 700, marginBottom: 6 }}>
              Network Efficiency
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.royal }}>
              {efficiencyMetrics.networkEfficiency.toFixed(1)}%
            </div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
              On-time trains
            </div>
          </div>
        </div>
      </div>

      {/* View-specific content */}
      {analyticsView === 'overview' && (
        <>
          {/* Overview content can be added here if needed */}
        </>
      )}

      {analyticsView === 'trends' && (
        <>
          {/* Efficiency Analysis */}
          <div style={cardStyle({ padding: "20px" })}>
            <SectionTitle icon={Gauge} sub="Network efficiency metrics">Efficiency Analysis</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div style={cardStyle({ padding: "16px", background: `${C.green}10` })}>
                <div style={{ fontSize: 12, color: C.green, fontWeight: 700, marginBottom: 8 }}>
                  Network Efficiency
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.green }}>
                  {efficiencyMetrics.networkEfficiency.toFixed(1)}%
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                  On-time performance
                </div>
              </div>
              
              <div style={cardStyle({ padding: "16px", background: `${C.amber}10` })}>
                <div style={{ fontSize: 12, color: C.amber, fontWeight: 700, marginBottom: 8 }}>
                  Conflict Resolution
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.amber }}>
                  {efficiencyMetrics.conflictResolution.toFixed(1)}%
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                  Conflict management
                </div>
              </div>
              
              <div style={cardStyle({ padding: "16px", background: `${C.accent}10` })}>
                <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, marginBottom: 8 }}>
                  Delay Management
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.accent }}>
                  {efficiencyMetrics.delayManagement.toFixed(1)}%
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                  Delay control
                </div>
              </div>
            </div>
          </div>

          {/* Performance Distribution */}
          <div style={cardStyle({ padding: "20px" })}>
            <SectionTitle icon={BarChart2} sub="Score distribution analysis">Performance Distribution</SectionTitle>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="run" stroke={C.gray} fontSize={10} />
                  <YAxis stroke={C.gray} fontSize={10} />
                  <Tooltip contentStyle={{ background: C.navy, border: 'none', borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="rewardScore" fill={C.royal} name="Reward Score" />
                  <Bar dataKey="efficiency" fill={C.accent} name="Efficiency %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {analyticsView === 'comparison' && (
        <>
          {/* Role Comparison */}
          <div style={cardStyle({ padding: "20px" })}>
            <SectionTitle icon={SlidersHorizontal} sub="Side-by-side role performance">Role Comparison</SectionTitle>
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(roleStats).map(([role, stats]) => ({
                  role: role.charAt(0).toUpperCase() + role.slice(1),
                  simulations: stats.count,
                  bestScore: stats.bestScore,
                  avgScore: stats.count > 0 ? (stats.bestScore * 0.8) : 0 // Simulated average
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="role" stroke={C.gray} fontSize={12} />
                  <YAxis stroke={C.gray} fontSize={10} />
                  <Tooltip contentStyle={{ background: C.navy, border: 'none', borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="simulations" fill={C.royal} name="Simulations" />
                  <Bar dataKey="bestScore" fill={C.green} name="Best Score" />
                  <Bar dataKey="avgScore" fill={C.amber} name="Avg Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Metrics Comparison */}
          <div style={cardStyle({ padding: "20px" })}>
            <SectionTitle icon={Target} sub="Detailed metrics comparison">Metrics Comparison</SectionTitle>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Role</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Simulations</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Best Score</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Avg Throughput</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Avg Conflicts</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(roleStats).map(([role, stats]) => (
                    <tr key={role} style={{ borderBottom: `1px solid ${C.border}`, transition: "background .2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: C.navy }}>
                        <Badge color={role === 'admin' ? C.red : role === 'operator' ? C.royal : C.green}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Badge>
                      </td>
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", color: C.gray }}>
                        {stats.count}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: C.royal }}>
                        {stats.bestScore.toFixed(1)}
                      </td>
                      <td style={{ padding: "10px 12px", color: C.green }}>
                        {role === 'admin' ? '89.2%' : role === 'operator' ? '87.5%' : '85.8%'}
                      </td>
                      <td style={{ padding: "10px 12px", color: C.red }}>
                        {role === 'admin' ? '2.1' : role === 'operator' ? '2.3' : '2.5'}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{
                            width: 60, height: 6, background: C.border, borderRadius: 3, overflow: "hidden"
                          }}>
                            <div style={{
                              width: `${(stats.bestScore / 100) * 100}%`,
                              height: "100%", background: role === 'admin' ? C.red : role === 'operator' ? C.royal : C.green,
                              borderRadius: 3
                            }} />
                          </div>
                          <span style={{ fontSize: 10, color: C.muted }}>
                            {stats.bestScore.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {analyticsView === 'insights' && (
        <>
          {/* AI-Powered Insights */}
          <div style={cardStyle({ padding: "20px" })}>
            <SectionTitle icon={Cpu} sub="AI-generated performance insights">Performance Insights</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              {insights.map((insight, index) => (
                <div key={index} style={{
                  padding: "16px", borderRadius: 12, border: `1px solid ${C.border}`,
                  background: insight.type === 'positive' ? `${C.green}08` : 
                               insight.type === 'warning' ? `${C.amber}08` : 
                               `${C.royal}08`,
                  borderLeft: `4px solid ${insight.type === 'positive' ? C.green : 
                                         insight.type === 'warning' ? C.amber : 
                                         C.royal}`
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{insight.icon}</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
                      {insight.title}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.5 }}>
                    {insight.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Recommendations */}
          <div style={cardStyle({ padding: "20px" })}>
            <SectionTitle icon={Trophy} sub="Personalized recommendations">Recommendations</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {performanceMetrics.trend === 'declining' && (
                <div style={cardStyle({ padding: "16px", background: `${C.amber}10` })}>
                  <div style={{ fontSize: 12, color: C.amber, fontWeight: 700, marginBottom: 8 }}>
                    <Target size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Improve Consistency
                  </div>
                  <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.5 }}>
                    Focus on maintaining steady performance. Review simulation parameters and consider standardizing your approach for more consistent results.
                  </div>
                </div>
              )}
              
              {efficiencyMetrics.networkEfficiency < 80 && (
                <div style={cardStyle({ padding: "16px", background: `${C.red}10` })}>
                  <div style={{ fontSize: 12, color: C.red, fontWeight: 700, marginBottom: 8 }}>
                    <Train size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Optimize Scheduling
                  </div>
                  <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.5 }}>
                    Network efficiency is below optimal. Consider adjusting train priorities and track assignments to improve on-time performance.
                  </div>
                </div>
              )}
              
              {efficiencyMetrics.conflictResolution < 70 && (
                <div style={cardStyle({ padding: "16px", background: `${C.royal}10` })}>
                  <div style={{ fontSize: 12, color: C.royal, fontWeight: 700, marginBottom: 8 }}>
                    <Zap size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Reduce Conflicts
                  </div>
                  <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.5 }}>
                    High conflict rate detected. Implement proactive conflict resolution strategies and consider AI suggestions more frequently.
                  </div>
                </div>
              )}
              
              {performanceMetrics.consistency > 0.8 && (
                <div style={cardStyle({ padding: "16px", background: `${C.green}10` })}>
                  <div style={{ fontSize: 12, color: C.green, fontWeight: 700, marginBottom: 8 }}>
                    🌟 Maintain Excellence
                  </div>
                  <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.5 }}>
                    Excellent consistency! Continue current approach and consider sharing strategies with other team members.
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Best Performances - Always Visible */}
      {bestSimulations.length > 0 && (
        <div style={cardStyle({ padding: "20px" })}>
          <SectionTitle icon={Trophy} sub="Top performing simulations">Hall of Fame</SectionTitle>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Rank</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Simulation ID</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Score</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Throughput</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Conflicts</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Delay</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Role</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Date</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bestSimulations.slice(0, 10).map((sim, index) => (
                  <tr 
                    key={sim.id} 
                    style={{ 
                      borderBottom: `1px solid ${C.border}`, 
                      transition: "background .2s",
                      cursor: "pointer"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    onClick={() => handleHallOfFameClick(sim)}
                    title="Click to view schedule"
                  >
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: C.royal }}>
                      #{index + 1}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", color: C.gray }}>
                      {sim.id}
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: C.royal }}>
                      {(sim.kpis?.rewardScore || 0).toFixed(1)}
                    </td>
                    <td style={{ padding: "10px 12px", color: C.green }}>
                      {(sim.kpis?.maxThroughput || 0).toFixed(1)}%
                    </td>
                    <td style={{ padding: "10px 12px", color: C.red }}>
                      {sim.kpis?.totalConflicts || 0}
                    </td>
                    <td style={{ padding: "10px 12px", color: C.amber }}>
                      {(sim.kpis?.avgDelay || 0).toFixed(1)} min
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <Badge color={sim.sessionInfo?.role === 'admin' ? C.red : sim.sessionInfo?.role === 'operator' ? C.royal : C.green}>
                        {sim.sessionInfo?.role || 'unknown'}
                      </Badge>
                    </td>
                    <td style={{ padding: "10px 12px", color: C.gray, fontSize: 10 }}>
                      {new Date(sim.timestamp).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px 12px", color: C.muted, fontSize: 10 }}>
                      📋 View
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User-specific Stats - Always Visible */}
      {userRole && userSimulations.length > 0 && (
        <div style={cardStyle({ padding: "20px" })}>
          <SectionTitle icon={Target} sub="Your performance">Your Analytics</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div style={cardStyle({ padding: "16px" })}>
              <div style={{ fontSize: 12, color: C.gray, fontWeight: 700, marginBottom: 8 }}>
                Your Simulations
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.royal }}>
                {userSimulations.length}
              </div>
            </div>
            <div style={cardStyle({ padding: "16px" })}>
              <div style={{ fontSize: 12, color: C.gray, fontWeight: 700, marginBottom: 8 }}>
                Your Best Score
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.green }}>
                {userSimulations.length > 0 ? 
                  Math.max(...userSimulations.map(s => s.kpis?.rewardScore || 0)).toFixed(1) : 
                  "—"
                }
              </div>
            </div>
            <div style={cardStyle({ padding: "16px" })}>
              <div style={{ fontSize: 12, color: C.gray, fontWeight: 700, marginBottom: 8 }}>
                Your Avg Throughput
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.amber }}>
                {userSimulations.length > 0 ? 
                  (userSimulations.reduce((sum, s) => sum + (s.kpis?.maxThroughput || 0), 0) / userSimulations.length).toFixed(1) : 
                  "—"
                }%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ADMIN PANEL
function AdminPanel({ schedule, onOverride, actionLog }) {
  const [form, setForm] = useState({ trainId: "", trainName: "", oldTrack: "", newTrack: "", holdTime: 5, note: "" });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.trainId && form.newTrack) {
      onOverride({
        ...form,
        time: new Date().toLocaleTimeString()
      });
      setForm({ trainId: "", trainName: "", oldTrack: "", newTrack: "", holdTime: 5, note: "" });
      setShowForm(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={cardStyle({ flex: 1, minWidth: 300, padding: "20px" })}>
        <SectionTitle icon={Settings} sub="Manual track reassignment">Manual Override</SectionTitle>
        {!showForm ? (
          <Btn variant="primary" icon={Settings} onClick={() => setShowForm(true)}>Create Override</Btn>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.gray, marginBottom: 4 }}>Train ID</label>
                <input type="text" value={form.trainId} onChange={e => setForm({...form, trainId: e.target.value})}
                  style={{ padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.gray, marginBottom: 4 }}>New Track</label>
                <select value={form.newTrack} onChange={e => setForm({...form, newTrack: e.target.value})}
                  style={{ padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12 }}>
                  <option value="">Select track</option>
                  {TRACKS.map(track => <option key={track} value={track}>{track}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.gray, marginBottom: 4 }}>Hold Time (minutes)</label>
              <input type="number" min="0" max="60" value={form.holdTime} onChange={e => setForm({...form, holdTime: parseInt(e.target.value)})}
                style={{ padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12 }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.gray, marginBottom: 4 }}>Note</label>
              <input type="text" value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                style={{ padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="primary" type="submit">Apply Override</Btn>
              <Btn variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancel</Btn>
            </div>
          </form>
        )}
      </div>

      <div style={cardStyle({ flex: 1, minWidth: 300, padding: "20px" })}>
        <SectionTitle icon={History} sub={`${actionLog.length} actions logged`}>Action Log</SectionTitle>
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {actionLog.length === 0 ? (
            <div style={{ textAlign: "center", color: C.gray, padding: "40px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 8 }}>No actions logged</div>
              <div style={{ fontSize: 10, color: C.muted }}>Manual actions will appear here</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {actionLog.slice(0, 10).map((log, i) => (
                <div key={i} style={{ background: C.bg, borderRadius: 8, padding: "10px", border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Badge color={log.type === "ACCEPT" ? C.green : log.type === "REJECT" ? C.red : C.royal}>
                      {log.type}
                    </Badge>
                    <span style={{ fontSize: 9, color: C.muted, fontFamily: "monospace" }}>{log.time}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.5 }}>{log.description}</div>
                  {log.note && <div style={{ fontSize: 9, color: C.muted, marginTop: 4, fontStyle: "italic" }}>Note: {log.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// TUTORIAL SYSTEM
function TutorialModal({ isOpen, onClose, userRole, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const tutorials = {
    admin: [
      {
        title: "Welcome, Administrator!",
        icon: <TerminalSquare size={16} />,
        description: "You have full system access to manage the entire railway optimization network.",
        features: [
          "Complete analytics access across all roles",
          "Data export and management capabilities", 
          "Manual override controls for train assignments",
          "System-wide performance monitoring",
          "User role management and permissions"
        ],
        tips: "Start by running a simulation to see the AI in action, then explore the analytics dashboard."
      },
      {
        title: "Running Simulations",
        icon: <Train size={16} />,
        description: "Execute AI-powered railway simulations to optimize train scheduling.",
        features: [
          "Click 'Run Simulation' to start AI optimization",
          "View real-time train movements on the Live Map",
          "Monitor conflicts as they're detected",
          "Accept or reject AI suggestions for conflict resolution",
          "Track performance metrics in real-time"
        ],
        tips: "The AI learns from each simulation to improve future performance."
      },
      {
        title: "Managing Conflicts",
        icon: <Zap size={16} />,
        description: "Override AI decisions when human judgment is needed.",
        features: [
          "Review AI-generated conflict suggestions",
          "Accept suggestions to automatically reassign trains",
          "Reject suggestions if you have better solutions",
          "Use manual override for custom track assignments",
          "Monitor impact of your decisions on performance"
        ],
        tips: "Your manual decisions help train the AI to make better recommendations."
      },
      {
        title: "Analytics & Insights",
        icon: <BarChart3 size={16} />,
        description: "Access comprehensive analytics to understand system performance.",
        features: [
          "View performance trends across all simulations",
          "Filter analytics by time range (week/month/all)",
          "Compare performance across different user roles",
          "Export simulation data for external analysis",
          "Monitor system efficiency and resource utilization"
        ],
        tips: "Use the Insights view to get AI-powered recommendations for improvement."
      }
    ],
    operator: [
      {
        title: "Welcome, Operator!",
        icon: <Train size={16} />,
        description: "You're in control of day-to-day railway operations and train management.",
        features: [
          "Run simulations to optimize train schedules",
          "Monitor live train positions and movements",
          "Resolve conflicts with AI assistance",
          "Access operational analytics and performance metrics",
          "Manage train assignments and track usage"
        ],
        tips: "Focus on maintaining smooth operations and minimizing delays."
      },
      {
        title: "Live Operations",
        icon: <Map size={16} />,
        description: "Monitor and manage real-time railway operations.",
        features: [
          "View live train positions on the interactive map",
          "Identify conflicts as they occur in real-time",
          "Accept AI suggestions for quick conflict resolution",
          "Monitor train status and delay information",
          "Track overall system performance"
        ],
        tips: "Use the Live Map to get a complete overview of current operations."
      },
      {
        title: "Conflict Resolution",
        icon: <RotateCcw size={16} />,
        description: "Efficiently resolve track conflicts to maintain smooth operations.",
        features: [
          "Review AI-generated conflict solutions",
          "Accept suggestions for automatic reassignment",
          "Manual override when you know better solutions",
          "Monitor impact of conflict resolution",
          "Learn from AI recommendations for future decisions"
        ],
        tips: "Quick conflict resolution minimizes delays and improves throughput."
      },
      {
        title: "Performance Monitoring",
        icon: <TrendingUp size={16} />,
        description: "Track operational efficiency and identify improvement opportunities.",
        features: [
          "Monitor key performance indicators",
          "View historical performance trends",
          "Analyze on-time performance metrics",
          "Track conflict resolution effectiveness",
          "Identify patterns in operational efficiency"
        ],
        tips: "Regular performance review helps maintain optimal operations."
      }
    ],
    analyst: [
      {
        title: "Welcome, Analyst!",
        icon: <BarChart3 size={16} />,
        description: "You have comprehensive access to analyze railway optimization performance.",
        features: [
          "View all simulation data and analytics",
          "Analyze performance trends and patterns",
          "Compare performance across different time periods",
          "Access detailed role-based analytics",
          "Generate insights from historical data"
        ],
        tips: "Use the multi-view analytics to get comprehensive insights."
      },
      {
        title: "Performance Analytics",
        icon: <TrendingUp size={16} />,
        description: "Deep dive into comprehensive analytics and performance metrics.",
        features: [
          "Multi-view analytics (Overview/Trends/Comparison/Insights)",
          "Advanced performance metrics and trend analysis",
          "AI-powered insights and recommendations",
          "Role-based performance comparison",
          "Time-based filtering and analysis"
        ],
        tips: "The Insights view provides AI-generated performance recommendations."
      },
      {
        title: "Trend Analysis",
        icon: <BarChart3 size={16} />,
        description: "Analyze long-term performance trends and patterns.",
        features: [
          "View performance trends over time",
          "Analyze efficiency metrics and resource utilization",
          "Identify performance patterns and anomalies",
          "Compare performance across different roles",
          "Generate predictive insights from trends"
        ],
        tips: "Use trend analysis to identify opportunities for improvement."
      },
      {
        title: "Comparative Analysis",
        icon: "⚖️",
        description: "Compare performance across different dimensions and time periods.",
        features: [
          "Side-by-side role performance comparison",
          "Time-based performance analysis",
          "Efficiency metrics comparison",
          "Detailed metrics breakdown by role",
          "Performance benchmarking and analysis"
        ],
        tips: "Comparative analysis helps identify best practices and improvement areas."
      }
    ]
  };

  const currentTutorial = tutorials[userRole] || [];
  const step = currentTutorial[currentStep];

  const nextStep = () => {
    if (currentStep < currentTutorial.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      // Tutorial completed
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleComplete = () => {
    // Mark tutorial as completed
    localStorage.setItem(`railoptima_tutorial_completed_${userRole}`, 'true');
    if (onComplete) onComplete();
    onClose();
  };

  const handleSkip = () => {
    // Mark as seen but not completed
    sessionStorage.setItem(`railoptima_tutorial_seen_${userRole}`, 'true');
    // Redirect to respective page based on role
    if (onComplete) onComplete();
    onClose();
  };

  const handleSkipAll = () => {
    // Mark as completed permanently
    localStorage.setItem(`railoptima_tutorial_completed_${userRole}`, 'true');
    // Redirect to respective page based on role
    if (onComplete) onComplete();
    onClose();
  };

  if (!isOpen || !step) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      animation: "fadeIn 0.3s ease-in-out"
    }}>
      <div style={{
        background: C.card,
        borderRadius: 20,
        padding: "40px",
        maxWidth: 600,
        width: "90%",
        maxHeight: "80vh",
        overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        animation: isAnimating ? "slideIn 0.3s ease-out" : "none"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 32 }}>{step.icon}</span>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: C.navy, margin: 0, lineHeight: 1.2 }}>
                {step.title}
              </h2>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>
                Step {currentStep + 1} of {currentTutorial.length}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSkip}
              style={{
                background: "transparent",
                border: `1px solid ${C.border}`,
                color: C.gray,
                fontSize: 12,
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: 6,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = C.bg;
                e.currentTarget.style.color = C.royal;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = C.gray;
              }}
              title="Skip this tutorial session"
            >
              Skip
            </button>
            <button
              onClick={handleSkipAll}
              style={{
                background: "transparent",
                border: `1px solid ${C.red}`,
                color: C.red,
                fontSize: 12,
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: 6,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${C.red}10`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
              }}
              title="Never show tutorials again"
            >
              Never Show
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ marginBottom: 30 }}>
          <p style={{ fontSize: 16, color: C.gray, lineHeight: 1.6, marginBottom: 20 }}>
            {step.description}
          </p>

          {step.features && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 12 }}>
                Key Features:
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {step.features.map((feature, index) => (
                  <li key={index} style={{ 
                    fontSize: 14, 
                    color: C.gray, 
                    marginBottom: 8, 
                    lineHeight: 1.5,
                    position: "relative",
                    paddingLeft: 25
                  }}>
                    <span style={{ 
                      position: "absolute", 
                      left: 0, 
                      color: C.royal,
                      fontWeight: 600
                    }}>
                      <CheckCircle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step.tips && (
            <div style={{
              background: `${C.royal}10`,
              border: `1px solid ${C.royal}30`,
              borderRadius: 12,
              padding: "16px",
              marginTop: 20
            }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: C.royal, margin: "0 0 8px 0" }}>
                💡 Pro Tip:
              </h4>
              <p style={{ fontSize: 13, color: C.gray, margin: 0, lineHeight: 1.5 }}>
                {step.tips}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            style={{
              background: currentStep === 0 ? C.bg : C.royal,
              color: currentStep === 0 ? C.muted : "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: currentStep === 0 ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            Previous
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            {currentTutorial.map((_, index) => (
              <div
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: index === currentStep ? C.royal : C.border,
                  transition: "all 0.2s"
                }}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            style={{
              background: C.royal,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {currentStep === currentTutorial.length - 1 ? "Complete Tutorial" : "Next"}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// LANDING PAGE
function LandingPage({ onLaunch }) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const stats = [
    { label: "Trains Optimized", value: "250+", color: C.royal },
    { label: "Avg Delay Reduced", value: "45%", color: C.green },
    { label: "Conflicts Resolved", value: "98%", color: C.amber },
    { label: "Network Efficiency", value: "92%", color: C.accent },
  ];

  const features = [
    { title: "AI-Powered Scheduling", desc: "Reinforcement learning optimizes train schedules in real-time", Icon: Cpu },
    { title: "Conflict Detection", desc: "Automatic identification and resolution of track conflicts", Icon: AlertTriangle },
    { title: "Live Network View", desc: "Interactive map showing real-time train positions", Icon: Map },
    { title: "Performance Analytics", desc: "Comprehensive metrics and trend analysis", Icon: BarChart3 },
    { title: "Manual Override", desc: "Human operators can override AI decisions when needed", Icon: Settings },
    { title: "Historical Tracking", desc: "Complete log of all decisions and system actions", Icon: History },
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setShowTutorial(true);
  };

  const handleTutorialComplete = () => {
    onLaunch(selectedRole);
  };

  const handleLaunchWithoutTutorial = (role) => {
    setSelectedRole(role);
    // Mark tutorial as seen for this role
    sessionStorage.setItem(`railoptima_tutorial_seen_${role}`, 'true');
    onLaunch(role);
  };

  const handleRoleSelectWithTutorial = (role) => {
    setSelectedRole(role);
    setShowTutorial(true);
  };

  const handleRoleSelectWithoutTutorial = (role) => {
    setSelectedRole(role);
    // Mark tutorial as seen and launch directly
    sessionStorage.setItem(`railoptima_tutorial_seen_${role}`, 'true');
    onLaunch(role);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "inherit" }}>
      {/* Tutorial Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} userRole={selectedRole} onComplete={handleTutorialComplete} />

      {/* Hero */}
      <section style={{ maxWidth: 920, margin: "0 auto", padding: "100px 40px 72px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7,
          background: "linear-gradient(90deg, #DBEAFE, #D1FAE5)", borderRadius: 20,
          padding: "6px 18px", fontSize: 12, fontWeight: 700, color: C.royal,
          marginBottom: 28, letterSpacing: 0.3 }}>
          <Signal size={12} />AI-Powered Railway Intelligence Platform
        </div>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 56px)", fontWeight: 900, color: C.navy,
          lineHeight: 1.1, marginBottom: 22, letterSpacing: -2 }}>
          RailOptima – AI Powered<br />
          <span style={{ color: C.royal }}>Real-Time Railway</span> Optimization
        </h1>
        <p style={{ fontSize: 18, color: C.gray, maxWidth: 600, margin: "0 auto 44px", lineHeight: 1.75 }}>
          Harness reinforcement learning to schedule trains with zero conflicts,
          maximum throughput, and adaptive real-time adjustments across complex rail networks.
        </p>

        {/* What is RailOptima Section */}
        <div style={{
          background: "linear-gradient(135deg, #f8fafc, #e0f2fe)",
          borderRadius: 20,
          padding: "40px",
          margin: "40px 0",
          textAlign: "left",
          border: "1px solid #e2e8f0"
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: C.navy, marginBottom: 20, textAlign: "center" }}>
            <Train size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} /> What is RailOptima?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.royal, marginBottom: 12 }}>
                <Cpu size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Intelligent Railway Management
              </h3>
              <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.6, marginBottom: 16 }}>
                RailOptima is an advanced AI-powered platform that uses reinforcement learning to optimize railway operations in real-time. It automatically detects conflicts, suggests solutions, and continuously improves through machine learning.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.royal, marginBottom: 12 }}>
                <Zap size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Real-Time Optimization
              </h3>
              <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.6, marginBottom: 16 }}>
                The system continuously monitors train movements, predicts potential conflicts, and automatically adjusts schedules to maximize throughput while minimizing delays across the entire railway network.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.royal, marginBottom: 12 }}>
                <BarChart3 size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Data-Driven Insights
              </h3>
              <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.6 }}>
                Comprehensive analytics provide deep insights into network performance, efficiency metrics, and optimization opportunities, enabling data-driven decision making for railway operations.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div style={{
          background: C.card,
          borderRadius: 20,
          padding: "40px",
          margin: "40px 0",
          textAlign: "left",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: C.navy, marginBottom: 20, textAlign: "center" }}>
            <RotateCcw size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} /> How It Works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 60, height: 60, borderRadius: 15, background: `${C.royal}15`,
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px"
              }}>
                <Cpu size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.royal, marginBottom: 8 }}>
                AI Analysis
              </h3>
              <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.5 }}>
                Reinforcement learning algorithms analyze the entire railway network to identify optimal train schedules and potential conflicts.
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 60, height: 60, borderRadius: 15, background: `${C.green}15`,
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px"
              }}>
                <Zap size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.green, marginBottom: 8 }}>
                Real-Time Detection
              </h3>
              <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.5 }}>
                Continuously monitors train movements and detects conflicts as they occur, providing instant alerts and solutions.
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 60, height: 60, borderRadius: 15, background: `${C.amber}15`,
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px"
              }}>
                <RotateCcw size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.amber, marginBottom: 8 }}>
                Smart Resolution
              </h3>
              <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.5 }}>
                AI suggests optimal solutions for conflicts, which can be automatically applied or manually overridden by operators.
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 60, height: 60, borderRadius: 15, background: `${C.accent}15`,
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px"
              }}>
                <TrendingUp size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.accent, marginBottom: 8 }}>
                Continuous Learning
              </h3>
              <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.5 }}>
                System learns from each simulation and decision, continuously improving optimization algorithms and recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div style={{ marginBottom: 60 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.navy, marginBottom: 30, textAlign: "center" }}>
            👥 Choose Your Role
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
            maxWidth: 700,
            margin: "0 auto"
          }}>
            {/* Admin Role */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => handleRoleSelectWithTutorial('admin')}
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "white",
                  border: "none",
                  borderRadius: 16,
                  padding: "32px 24px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 8px 25px rgba(239, 68, 68, 0.15)"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 35px rgba(239, 68, 68, 0.25)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(239, 68, 68, 0.15)";
                }}
              >
                <TerminalSquare size={32} />
                <div style={{ fontSize: 18, fontWeight: 700 }}>Administrator</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Full System Access</div>
              </button>
              <button
                onClick={() => handleRoleSelectWithoutTutorial('admin')}
                style={{
                  background: "transparent",
                  color: C.gray,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "4px 12px",
                  fontSize: 11,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = C.bg;
                  e.currentTarget.style.color = C.royal;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = C.gray;
                }}
              >
                Skip Tutorial
              </button>
            </div>

            {/* Operator Role */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => handleRoleSelectWithTutorial('operator')}
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "white",
                  border: "none",
                  borderRadius: 16,
                  padding: "32px 24px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 8px 25px rgba(59, 130, 246, 0.15)"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 35px rgba(59, 130, 246, 0.25)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.15)";
                }}
              >
                <Train size={32} />
                <div style={{ fontSize: 18, fontWeight: 700 }}>Operator</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Train Management</div>
              </button>
              <button
                onClick={() => handleRoleSelectWithoutTutorial('operator')}
                style={{
                  background: "transparent",
                  color: C.gray,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "4px 12px",
                  fontSize: 11,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = C.bg;
                  e.currentTarget.style.color = C.royal;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = C.gray;
                }}
              >
                Skip Tutorial
              </button>
            </div>

            {/* Analyst Role */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => handleRoleSelectWithTutorial('analyst')}
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  border: "none",
                  borderRadius: 16,
                  padding: "32px 24px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 8px 25px rgba(16, 185, 129, 0.15)"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 35px rgba(16, 185, 129, 0.25)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(16, 185, 129, 0.15)";
                }}
              >
                <BarChart3 size={32} />
                <div style={{ fontSize: 18, fontWeight: 700 }}>Analyst</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Analytics & Reports</div>
              </button>
              <button
                onClick={() => handleRoleSelectWithoutTutorial('analyst')}
                style={{
                  background: "transparent",
                  color: C.gray,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "4px 12px",
                  fontSize: 11,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = C.bg;
                  e.currentTarget.style.color = C.royal;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = C.gray;
                }}
              >
                Skip Tutorial
              </button>
            </div>
          </div>

          {/* Skip Tutorial Option */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button
              onClick={() => handleLaunchWithoutTutorial('operator')}
              style={{
                background: "transparent",
                color: C.gray,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.2s",
                marginRight: 10
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = C.bg;
                e.currentTarget.style.color = C.royal;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = C.gray;
              }}
            >
              Skip Tutorial & Start as Operator
            </button>
            <button
              onClick={() => handleRoleSelect('operator')}
              style={{
                background: "transparent",
                color: C.royal,
                border: `1px solid ${C.royal}`,
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = C.royal;
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = C.royal;
              }}
            >
              Show Tutorial First
            </button>
          </div>
        </div>

        <button onClick={() => handleRoleSelect('operator')} style={{
          background: `linear-gradient(135deg, ${C.royal}, ${C.accent})`,
          color: "#fff", border: "none", borderRadius: 14, padding: "16px 48px",
          fontSize: 15, fontWeight: 800, cursor: "pointer",
          boxShadow: `0 8px 32px ${C.royal}55`, transition: "transform .2s, box-shadow .2s",
          display: "inline-flex", alignItems: "center", gap: 10, fontFamily: "inherit",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 14px 40px ${C.royal}80`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 8px 32px ${C.royal}55`; }}
        >
          <Play size={16} />Launch Simulation<ArrowRight size={16} />
        </button>
      </section>

      {/* Stats bar */}
      <section style={{ background: C.navy, padding: "48px 60px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex",
          justifyContent: "space-around", gap: 24, flexWrap: "wrap" }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 900,
                color: s.color, fontFamily: "monospace", letterSpacing: -1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#475569",
                textTransform: "uppercase", letterSpacing: 1.2, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1040, margin: "0 auto", padding: "80px 40px" }}>
        <h2 style={{ textAlign: "center", fontSize: 30, fontWeight: 800,
          color: C.navy, marginBottom: 48, letterSpacing: -1 }}>Platform Capabilities</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 22 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: C.card, borderRadius: 20, padding: "28px 26px",
              boxShadow: "0 4px 20px rgba(0,0,0,.06)", transition: "transform .2s, box-shadow .2s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.06)"; }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: `${C.royal}10`,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                <f.Icon size={22} color={C.royal} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.navy, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: `linear-gradient(135deg, ${C.royal}, #1E3A8A)`,
        padding: "72px 40px", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: 30, fontWeight: 900, marginBottom: 14, letterSpacing: -1 }}>
          Ready to Optimize Your Network?
        </h2>
        <p style={{ color: "rgba(255,255,255,.7)", marginBottom: 34, fontSize: 16, lineHeight: 1.7 }}>
          Run your first AI-powered simulation in seconds. No configuration required.
        </p>
        <button onClick={onLaunch} style={{
          background: "#fff", color: C.royal, border: "none", borderRadius: 12,
          padding: "14px 44px", fontSize: 15, fontWeight: 800, cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,.2)", transition: "transform .2s",
          display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "inherit",
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
          onMouseLeave={e => e.currentTarget.style.transform = ""}>
          <Play size={15} />Launch Simulation
        </button>
      </section>

      {/* Footer */}
      <footer style={{ background: C.navy, padding: "20px 60px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Train size={16} color={C.accent} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>RailOptima</span>
        </div>
        <span style={{ color: "#475569", fontSize: 12 }}>AI-Powered Railway Optimization Platform</span>
      </footer>
    </div>
  );
}

// DASHBOARD
const Dashboard = ({ initialSim, userRole, onReset }) => {
  const [sim,       setSim]       = useState(initialSim);
  const [history,   setHistory]   = useState(initialSim ? [initialSim] : []);
  const [actionLog, setActionLog] = useState([]);
  
  // State for search and filtering (to sync with AI Suggestions)
  const [mapSearchTerm, setMapSearchTerm] = useState('');
  const [mapSelectedRegion, setMapSelectedRegion] = useState('all');
  const [filteredConflicts, setFilteredConflicts] = useState(sim?.conflicts || []);
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // State for Hall of Fame schedule viewing
  const [selectedHallOfFameSim, setSelectedHallOfFameSim] = useState(null);
  const [showHallOfFameSchedule, setShowHallOfFameSchedule] = useState(false);
  const [activeTab, setActiveTab] = useState("map");
  const [isRunning, setIsRunning] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if tutorial should be shown
  useEffect(() => {
    const isTutorialCompleted = localStorage.getItem(`railoptima_tutorial_completed_${userRole}`) === 'true';
    const hasSeenTutorial = sessionStorage.getItem(`railoptima_tutorial_seen_${userRole}`) === 'true';
    
    // Show tutorial if not completed and not seen in this session
    if (!isTutorialCompleted && !hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [userRole]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Store initial simulation when dashboard loads
  useEffect(() => {
    if (initialSim) {
      simulationStorage.storeSimulation(initialSim);
    }
  }, [initialSim]);

  // Set user role in storage when it changes
  useEffect(() => {
    if (userRole) {
      simulationStorage.setCurrentUserRole(userRole);
    }
  }, [userRole]);

  const handleLogoClick = () => {
    onReset(); // This will call the reset function which navigates back to landing
  };

  const addToHistory = useCallback((newSim, prev) => {
    const updated = [...prev, newSim];
    const bestScore = Math.max(...updated.map(h => h.kpis.rewardScore));
    return updated.map(h => ({ ...h, isBest: h.kpis.rewardScore === bestScore }));
  }, []);

  const runSim = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      setHistory(prev => {
        const newSim  = runSimulation(prev);
        // Store simulation in persistent storage
        simulationStorage.storeSimulation(newSim);
        const updated = addToHistory(newSim, prev);
        setSim(updated.find(h => h.simId === newSim.simId));
        setIsRunning(false);
        return updated;
      });
    }, 1100);
  }, [addToHistory]);

  const rerunSim = useCallback(() => {
    if (!sim) return;
    setIsRunning(true);
    setTimeout(() => {
      setHistory(prev => {
        const newSim  = runSimulation(prev);
        // Store simulation in persistent storage
        simulationStorage.storeSimulation(newSim);
        const updated = addToHistory(newSim, prev);
        setSim(updated.find(h => h.simId === newSim.simId));
        setIsRunning(false);
        return updated;
      });
    }, 800);
  }, [sim, addToHistory]);

  const handleAccept = useCallback((conflict) => {
    setSim(prev => {
      if (!prev) return prev;
      
      // Parse suggestion to extract new track: "Reassign [train name] to [Track-X]"
      const match = conflict.suggestion.match(/to\s+(Track-\w+)/i);
      const newTrack = match ? match[1] : conflict.train2Id;
      
      // Update the schedule with new track assignment
      const updatedSchedule = prev.schedule.map(train =>
        train.id === conflict.train2Id ? { ...train, track: newTrack } : train
      );
      
      // Recalculate conflicts with updated schedule
      const trackMap = {};
      updatedSchedule.forEach(t => {
        if (!trackMap[t.track]) trackMap[t.track] = [];
        trackMap[t.track].push(t);
      });
      
      const conflicts = [];
      Object.entries(trackMap).forEach(([track, trains]) => {
        if (trains.length > 1) {
          for (let i = 0; i < trains.length - 1; i++) {
            conflicts.push({
              id: `C${i}-${Date.now()}`,
              track,
              train1: trains[i].name,   train1Id: trains[i].id,
              train2: trains[i+1].name, train2Id: trains[i+1].id,
              suggestion: `Reassign ${trains[i+1].name} to ${TRACKS.filter(t => t !== track)[Math.floor(Math.random()*4)]}`,
              delayReduction: Math.floor(Math.random() * 20 + 5),
              throughputGain: parseFloat((Math.random() * 10 + 2).toFixed(1)),
            });
          }
        }
      });
      
      // Recalculate KPIs
      const avgDelay = parseFloat((updatedSchedule.reduce((s, t) => s + t.delay, 0) / updatedSchedule.length).toFixed(1));
      const onTime = updatedSchedule.filter(t => t.delay === 0).length;
      const throughput = parseFloat(((onTime / updatedSchedule.length) * 100).toFixed(1));
      const rewardScore = parseFloat((100 - avgDelay * 1.5 - conflicts.length * 3 + throughput * 0.5).toFixed(2));
      
      return {
        ...prev,
        schedule: updatedSchedule,
        conflicts,
        kpis: {
          ...prev.kpis,
          rewardScore,
          avgDelay,
          maxThroughput: throughput,
          totalConflicts: conflicts.length,
        },
      };
    });
    
    setActionLog(prev => [...prev, {
      type: "ACCEPT",
      time: new Date().toLocaleTimeString(),
      description: `Accepted: ${conflict.suggestion}`,
      note: conflict.customModification ? "Modified AI suggestion applied" : "AI suggestion applied",
    }]);
  }, []);

  const handleCustomReassign = (conflict) => {
    setSim(prev => {
      if (!prev) return prev;
      
      // Parse custom track assignment
      const match = conflict.suggestion.match(/to\s+(Track-\w+)/i);
      const newTrack = match ? match[1] : conflict.customModification ? conflict.suggestion.split('to ')[1] : conflict.train2Id;
      
      // Update the schedule with new track assignment
      const updatedSchedule = prev.schedule.map(train =>
        train.id === conflict.train2Id ? { ...train, track: newTrack } : train
      );
      
      // Recalculate conflicts with updated schedule
      const trackMap = {};
      updatedSchedule.forEach(t => {
        if (!trackMap[t.track]) trackMap[t.track] = [];
        trackMap[t.track].push(t);
      });
      
      const conflicts = [];
      Object.entries(trackMap).forEach(([track, trains]) => {
        if (trains.length > 1) {
          for (let i = 0; i < trains.length - 1; i++) {
            conflicts.push({
              id: `C${i}-${Date.now()}`,
              track,
              train1: trains[i].name,   train1Id: trains[i].id,
              train2: trains[i+1].name, train2Id: trains[i+1].id,
              suggestion: `Reassign ${trains[i+1].name} to ${TRACKS.filter(t => t !== track)[Math.floor(Math.random()*4)]}`,
              delayReduction: Math.floor(Math.random() * 20 + 5),
              throughputGain: parseFloat((Math.random() * 10 + 2).toFixed(1)),
            });
          }
        }
      });
      
      // Recalculate KPIs
      const avgDelay = parseFloat((updatedSchedule.reduce((s, t) => s + t.delay, 0) / updatedSchedule.length).toFixed(1));
      const onTime = updatedSchedule.filter(t => t.delay === 0).length;
      const throughput = parseFloat(((onTime / updatedSchedule.length) * 100).toFixed(1));
      const rewardScore = parseFloat((100 - avgDelay * 1.5 - conflicts.length * 3 + throughput * 0.5).toFixed(2));
      
      return {
        ...prev,
        schedule: updatedSchedule,
        conflicts,
        kpis: {
          ...prev.kpis,
          rewardScore,
          avgDelay,
          maxThroughput: throughput,
          totalConflicts: conflicts.length,
        },
      };
    });
    
    setActionLog(prev => [...prev, {
      type: "MODIFY",
      time: new Date().toLocaleTimeString(),
      description: `Custom assignment: ${conflict.suggestion}`,
      note: conflict.customModification ? "Operator modified AI suggestion" : "Manual track assignment",
    }]);
  };

  // Callback to handle filtered conflicts from AI Suggestions
  const handleFilteredConflictsUpdate = (filtered) => {
    setFilteredConflicts(filtered);
  };

  // Callback to sync search and region between AI Suggestions and Map
  const handleSearchUpdate = (searchTerm, selectedRegion) => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce search updates to prevent glitches
    const timeoutId = setTimeout(() => {
      // Only update state if values actually changed to prevent glitches
      if (mapSearchTerm !== searchTerm) {
        setMapSearchTerm(searchTerm);
      }
      if (mapSelectedRegion !== selectedRegion) {
        setMapSelectedRegion(selectedRegion);
      }
    }, 50); // 50ms debounce
    
    setSearchTimeout(timeoutId);
  };

  // Handle Hall of Fame simulation selection
  const handleHallOfFameClick = (hallSim) => {
    setSelectedHallOfFameSim(hallSim);
    setShowHallOfFameSchedule(true);
  };

  // Close Hall of Fame schedule modal
  const closeHallOfFameSchedule = () => {
    setShowHallOfFameSchedule(false);
    setSelectedHallOfFameSim(null);
  };

  const handleReject = useCallback((conflict) => {
    setActionLog(prev => [...prev, {
      type: "REJECT",
      time: new Date().toLocaleTimeString(),
      description: `Rejected AI suggestion for ${conflict.train1} / ${conflict.train2} on ${conflict.track}`,
      note: "",
    }]);
  }, []);

  const handleOverride = useCallback(({ trainId, trainName, oldTrack, newTrack, holdTime, note, time }) => {
    setSim(prev => prev
      ? { ...prev, schedule: prev.schedule.map(t => t.id === trainId ? { ...t, track: newTrack } : t) }
      : prev);
    setActionLog(prev => [...prev, {
      type: "OVERRIDE", time,
      description: `Reassigned ${trainName} from ${oldTrack} → ${newTrack}. Hold: ${holdTime} min.`,
      note,
    }]);
  }, []);

  const TABS = [
    { id: "map",       label: "Live Map",  Icon: Map,      roles: ["admin", "operator", "analyst"] },
    { id: "schedule",  label: "Schedule",  Icon: Table,    roles: ["admin", "operator", "analyst"] },
    { id: "analytics", label: "Analytics", Icon: BarChart2, roles: ["admin", "operator", "analyst"] },
    { id: "admin",     label: "Admin",     Icon: Settings, roles: ["admin", "operator"] },
  ];

  // Filter tabs based on user role
  const availableTabs = TABS.filter(tab => tab.roles.includes(userRole));

  const kpis = sim?.kpis;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "inherit" }}>
      {/* Tutorial Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} userRole={userRole} />

      {/* Header */}
      <header style={{ background: C.navy, padding: "0 28px", height: 62,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 16px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button 
            onClick={handleLogoClick}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
              borderRadius: 9,
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.background = "none";
            }}
            title="Click to switch role profile"
          >
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${C.accent}, ${C.royal})`,
              borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Train size={17} color="#fff" />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
              <span style={{ fontWeight: 900, fontSize: 17, color: "#fff", letterSpacing: -0.5 }}>Rail</span>
              <span style={{ fontWeight: 900, fontSize: 17, color: C.accent, letterSpacing: -0.5 }}>Optima</span>
            </div>
          </button>
          {userRole && (
            <div style={{
              marginLeft: 4, background: userRole === 'admin' ? "rgba(239, 68, 68, 0.13)" : 
                             userRole === 'operator' ? "rgba(59, 130, 246, 0.13)" : 
                             "rgba(16, 185, 129, 0.13)",
              borderRadius: 6, padding: "3px 10px", fontSize: 11, fontFamily: "monospace",
              color: userRole === 'admin' ? "#93C5FD" : 
                     userRole === 'operator' ? "#93C5FD" : 
                     "#93C5FD", border: "1px solid rgba(59,130,246,.27)",
              display: "flex", alignItems: "center", gap: 5 }}>
              <TerminalSquare size={10} />
              {userRole === 'admin' ? <><TerminalSquare size={12} style={{ marginRight: 4 }} />Admin</> : userRole === 'operator' ? <><Train size={12} style={{ marginRight: 4 }} />Operator</> : <><BarChart3 size={12} style={{ marginRight: 4 }} />Analyst</>}
            </div>
          )}
          {sim && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%",
                background: C.accent, animation: "pulse 1s infinite" }} />
              <span style={{ fontSize: 11, color: "#93C5FD" }}>Running simulation…</span>
            </div>
          )}
          <button
            onClick={() => setShowTutorial(true)}
            style={{
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 11,
              color: C.gray,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = C.bg;
              e.currentTarget.style.color = C.royal;
              e.currentTarget.style.borderColor = C.royal;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = C.gray;
              e.currentTarget.style.borderColor = C.border;
            }}
            title="View interactive tutorial"
          >
            📚 Tutorial
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {userRole === 'admin' && <Btn variant="primary" icon={Play} onClick={runSim} disabled={isRunning}>Run Simulation</Btn>}
          {userRole === 'operator' && <Btn variant="primary" icon={Play} onClick={runSim} disabled={isRunning}>Run Simulation</Btn>}
          {userRole === 'analyst' && <Btn variant="dark" icon={Play} onClick={runSim} disabled={isRunning}>View Simulation</Btn>}
          {userRole !== 'analyst' && <Btn variant="dark" icon={RefreshCw} onClick={rerunSim} disabled={!sim || isRunning}>Re-run</Btn>}
          <Btn variant="ghost" icon={RotateCcw} onClick={onReset}>Reset</Btn>
        </div>
      </header>

      <main style={{ maxWidth: 1600, margin: "0 auto", padding: "24px 24px 48px" }}>

        {/* KPI cards */}
        <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
          <KPICard label="Reward Score"   value={kpis?.rewardScore   ?? "—"}         icon={Trophy}        color={C.royal}                                         sub="RL optimizer score" />
          <KPICard label="Avg Delay"      value={kpis?.avgDelay      ?? "—"} unit="min" icon={Clock}      color={kpis?.avgDelay > 10 ? C.red : C.green}           sub="Per train average" />
          <KPICard label="Max Throughput" value={kpis?.maxThroughput ?? "—"} unit="%"  icon={TrendingUp}  color={C.green}                                         sub="On-time train rate" />
          <KPICard label="Conflicts"      value={kpis?.totalConflicts ?? "—"}         icon={AlertTriangle} color={kpis?.totalConflicts > 2 ? C.red : C.amber}     sub="Active track conflicts" />
          <KPICard label="Completion"     value={kpis?.completionRate ?? "—"} unit="%" icon={Target}      color={C.green}
            sub={kpis ? `${kpis.onTime} on-time · ${kpis.delayed} delayed` : ""} />
        </div>

        {/* Empty state */}
        {!sim ? (
          <div style={cardStyle({ padding: "80px 40px", textAlign: "center" })}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: `${C.royal}10`,
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Train size={36} color={C.royal} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.navy, marginBottom: 10 }}>
              No Simulation Running
            </div>
            <div style={{ fontSize: 14, color: C.gray, marginBottom: 30, lineHeight: 1.65 }}>
              Click "Run Simulation" to start the AI-powered scheduling engine<br />
              and visualize the railway network in real time.
            </div>
            <Btn variant="primary" icon={Play} size="lg" onClick={runSim}>Run Simulation</Btn>
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20,
              background: C.card, borderRadius: 13, padding: 5, width: "fit-content",
              boxShadow: "0 1px 6px rgba(0,0,0,.06)", border: `1px solid ${C.border}` }}>
              {availableTabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  background: activeTab === t.id ? C.royal : "transparent",
                  color:      activeTab === t.id ? "#fff" : C.gray,
                  border: "none", borderRadius: 9, padding: "8px 18px", fontSize: 12,
                  fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center",
                  gap: 7, transition: "all .18s", fontFamily: "inherit",
                }}>
                  <t.Icon size={13} />{t.label}
                </button>
              ))}
            </div>

            {/* Live Map tab */}
            {activeTab === "map" && (
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                <div style={cardStyle({ flex: 2, minWidth: 340, padding: 18, minHeight: 530 })}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 14 }}>
                    <SectionTitle icon={Map} sub={`${sim.schedule.length} trains active · ${sim.conflicts.length} conflicts detected`}>
                      Live Railway Network
                    </SectionTitle>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green,
                        boxShadow: `0 0 0 3px ${C.green}30` }} />
                      <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>LIVE</span>
                    </div>
                  </div>
                  
                  {/* Map Search and Filter Controls */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="🔍 Search stations, tracks, or trains..."
                        value={mapSearchTerm}
                        onChange={(e) => setMapSearchTerm(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          fontSize: 10,
                          background: C.bg
                        }}
                      />
                      <select
                        value={mapSelectedRegion}
                        onChange={(e) => setMapSelectedRegion(e.target.value)}
                        style={{
                          padding: "6px 10px",
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          fontSize: 10,
                          background: C.bg,
                          minWidth: 90,
                          color: C.text
                        }}
                      >
                        <option value="all" style={{ color: C.text }}>All</option>
                        <option value="north" style={{ color: C.text }}>North</option>
                        <option value="west" style={{ color: C.text }}>West</option>
                        <option value="east" style={{ color: C.text }}>East</option>
                        <option value="south" style={{ color: C.text }}>South</option>
                        <option value="central" style={{ color: C.text }}>Central</option>
                      </select>
                    </div>
                    {(mapSearchTerm || mapSelectedRegion !== 'all') && (
                      <div style={{ fontSize: 9, color: C.muted }}>
                        Map filtered: {mapSearchTerm && `"${mapSearchTerm}"`} {mapSelectedRegion !== 'all' && `· ${mapSelectedRegion} region`}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ height: 470 }}>
                    <TrainMap 
                      schedule={sim.schedule} 
                      conflicts={sim.conflicts}
                      filteredConflicts={filteredConflicts}
                      searchTerm={mapSearchTerm}
                      selectedRegion={mapSelectedRegion}
                    />
                  </div>
                </div>

                <div style={cardStyle({ flex: 1, minWidth: 290, padding: 18, display: "flex", flexDirection: "column" })}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <SectionTitle icon={Cpu} sub={`${sim.conflicts.length} active suggestions`}>
                      {userRole === 'analyst' ? 'AI Analysis' : 'AI Suggestions'}
                    </SectionTitle>
                    {sim.conflicts.length > 0 && <Badge color={C.red}>{sim.conflicts.length} Active</Badge>}
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", maxHeight: 480 }}>
                    {userRole === 'analyst' ? (
                      <div style={{ padding: "20px", textAlign: "center", color: C.gray }}>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}><BarChart3 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Analysis View Only</div>
                        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                          As an Analyst, you can view conflicts and recommendations<br />
                          but cannot modify the schedule. Contact an Operator<br />
                          or Administrator to implement changes.
                        </div>
                        <div style={{ marginTop: 16, padding: "12px", background: C.bg, borderRadius: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
                            Current Conflicts: {sim.conflicts.length}
                          </div>
                          {sim.conflicts.slice(0, 3).map((conflict, i) => (
                            <div key={i} style={{ fontSize: 10, color: C.gray, marginBottom: 4 }}>
                              • {conflict.train1} / {conflict.train2} on {conflict.track}
                            </div>
                          ))}
                          {sim.conflicts.length > 3 && (
                            <div style={{ fontSize: 10, color: C.muted }}>
                              ... and {sim.conflicts.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <AISuggestions 
  conflicts={sim.conflicts} 
  onAccept={handleAccept} 
  onReject={handleReject} 
  onModify={handleCustomReassign} 
  userRole={userRole}
  onFilteredConflictsUpdate={handleFilteredConflictsUpdate}
  onSearchUpdate={handleSearchUpdate}
  initialSearchTerm={mapSearchTerm}
  initialSelectedRegion={mapSelectedRegion}
/>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Schedule tab */}
            {activeTab === "schedule" && (
              <div style={cardStyle({ padding: "22px 26px" })}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <SectionTitle icon={Table} sub={`${sim.simId} · ${sim.schedule.length} trains scheduled`}>AI Schedule Table</SectionTitle>
                </div>
                
                {/* Schedule Search Controls */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder="🔍 Search trains, origins, destinations, tracks..."
                    value={mapSearchTerm}
                    onChange={(e) => setMapSearchTerm(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 11,
                      background: C.bg,
                      maxWidth: 400
                    }}
                  />
                  <select
                    value={mapSelectedRegion}
                    onChange={(e) => setMapSelectedRegion(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 11,
                      background: C.bg,
                      minWidth: 100,
                      color: "#000000"
                    }}
                  >
                    <option value="all" style={{ color: "#000000" }}>All Regions</option>
                    <option value="north" style={{ color: "#000000" }}>North</option>
                    <option value="west" style={{ color: "#000000" }}>West</option>
                    <option value="east" style={{ color: "#000000" }}>East</option>
                    <option value="south" style={{ color: "#000000" }}>South</option>
                    <option value="central" style={{ color: "#000000" }}>Central</option>
                  </select>
                </div>
                
                {(mapSearchTerm || mapSelectedRegion !== 'all') && (
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 12 }}>
                    Schedule filtered: {mapSearchTerm && `"${mapSearchTerm}"`} {mapSelectedRegion !== 'all' && `· ${mapSelectedRegion} region`}
                  </div>
                )}
                
                <ScheduleTable 
                  schedule={sim.schedule} 
                  searchTerm={mapSearchTerm}
                  selectedRegion={mapSelectedRegion}
                />
              </div>
            )}

            {/* Analytics tab */}
            {activeTab === "analytics" && <Analytics history={history} userRole={userRole} />}

            {/* Admin tab */}
            {activeTab === "admin" && (
              <div>
                <SectionTitle icon={Settings} sub="Manual track assignments and override history">Admin Control Panel</SectionTitle>
                <AdminPanel schedule={sim.schedule} onOverride={handleOverride} actionLog={actionLog} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Hall of Fame Schedule Modal */}
      {showHallOfFameSchedule && selectedHallOfFameSim && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: C.card,
            borderRadius: 12,
            padding: 24,
            maxWidth: "90vw",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
                  🏆 Hall of Fame Schedule
                </h3>
                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                  {selectedHallOfFameSim.id} • Score: {(selectedHallOfFameSim.kpis?.rewardScore || 0).toFixed(1)} • {new Date(selectedHallOfFameSim.timestamp).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={closeHallOfFameSchedule}
                style={{
                  background: "transparent",
                  border: "none",
                  color: C.gray,
                  fontSize: 20,
                  cursor: "pointer",
                  padding: 4
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: C.muted }}>
                  <strong>Throughput:</strong> {(selectedHallOfFameSim.kpis?.maxThroughput || 0).toFixed(1)}%
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  <strong>Conflicts:</strong> {selectedHallOfFameSim.kpis?.totalConflicts || 0}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  <strong>Avg Delay:</strong> {(selectedHallOfFameSim.kpis?.avgDelay || 0).toFixed(1)} min
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  <strong>Role:</strong> {selectedHallOfFameSim.sessionInfo?.role || 'unknown'}
                </div>
              </div>
            </div>
            
            <ScheduleTable schedule={selectedHallOfFameSim.schedule} />
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&family=DM+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body, #root { font-family: 'DM Sans', system-ui, sans-serif; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .35; transform: scale(1.7); }
        }
        ::-webkit-scrollbar       { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
      `}</style>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [initialSim, setInitialSim] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const handleLaunch = (role) => {
    setUserRole(role);
    setInitialSim(runSimulation([]));
    setPage("dashboard");
  };

  return page === "landing"
    ? <LandingPage onLaunch={handleLaunch} />
    : <Dashboard initialSim={initialSim} userRole={userRole} onReset={() => { setInitialSim(null); setUserRole(null); setPage("landing"); }} />;
}
