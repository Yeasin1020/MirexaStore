"use client";

import WithAuth from "@/app/lib/utils/withAuth";
import { useEffect, useState } from "react";
import Axios from "axios";
import { FaDollarSign, FaBox, FaChartLine, FaUsers } from "react-icons/fa";
import { useAppSelector } from "@/app/lib/redux/hook";
import { Bar } from "react-chartjs-2";
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import Loading from "@/app/loading";

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip);

const AdminAnalytics = () => {
  const auth = useAppSelector((state: { auth: any }) => state.auth);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProductsSold, setTotalProductsSold] = useState(0);
  const [uniqueSellers, setUniqueSellers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0); // Track total users
  const [totalResellers, setTotalResellers] = useState(0); // Track total resellers
  const [sellerSalesMap, setSellerSalesMap] = useState<any>({});
  const [sellerStatusMap, setSellerStatusMap] = useState<any>({});

  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [],
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10); // You can change this to any value for pagination

  useEffect(() => {
    const fetchOrdersAndUsers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No token found. Please log in.");
          return;
        }

        const [ordersResponse, usersResponse] = await Promise.all([
          Axios.get(
            "https://e-commerce-backend-ashy-eight.vercel.app/api/checkout",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          Axios.get(
            "https://e-commerce-backend-ashy-eight.vercel.app/api/users",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
        ]);

        const allOrders = ordersResponse.data.data;
        const allUsers = usersResponse.data.data;

        const sellerMap: any = {};
        const sellerStatus: any = {}; // Track status for each seller
        let totalAmount = 0;
        let totalItemCount = 0;
        let totalUniqueSellers = new Set<string>();

        // Track resellers by their email
        const resellerEmails = new Set<string>();

        allOrders.forEach((order: any) => {
          order.items.forEach((item: any) => {
            const sellerEmail = item.sellerEmail;
            if (sellerEmail) {
              resellerEmails.add(sellerEmail); // Collect resellers

              totalAmount += item.price * item.quantity;
              totalItemCount += item.quantity;
              totalUniqueSellers.add(sellerEmail);

              const sellerKey = sellerEmail;
              if (!sellerMap[sellerKey]) sellerMap[sellerKey] = 0;
              sellerMap[sellerKey] += item.price * item.quantity;

              // Update seller order status counts
              if (!sellerStatus[sellerKey]) {
                sellerStatus[sellerKey] = {
                  delivered: 0,
                  Processing: 0,
                  Shipped: 0,
                };
              }

              if (order.status === "Delivered") {
                sellerStatus[sellerKey].delivered += item.quantity;
              } else if (order.status === "Processing") {
                sellerStatus[sellerKey].Processing += item.quantity;
              } else if (order.status === "Shipped") {
                sellerStatus[sellerKey].Shipped += item.quantity;
              }
            }
          });
        });

        // Count total users and resellers
        setTotalUsers(allUsers.length);

        // Filter users with role "reseller" and set total resellers
        const resellers = allUsers.filter(
          (user: { role: string }) => user.role === "reseller"
        );
        setTotalResellers(resellers.length);

        setOrders(allOrders);
        setUsers(allUsers);
        setTotalSales(totalAmount);
        setTotalOrders(allOrders.length);
        setTotalProductsSold(totalItemCount);
        setUniqueSellers(totalUniqueSellers.size);
        setSellerSalesMap(sellerMap);
        setSellerStatusMap(sellerStatus);

        const sellerLabels = Object.keys(sellerMap);
        const sellerData = Object.values(sellerMap);

        setChartData({
          labels: sellerLabels,
          datasets: [
            {
              label: "Sales by Seller (৳)",
              data: sellerData,
              backgroundColor: "#F97316",
            },
          ],
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data. Please try again.");
        setLoading(false);
      }
    };

    if (auth?.user?.role === "admin") {
      fetchOrdersAndUsers();
    } else {
      setError("You are not authorized to view this page.");
    }
  }, [auth?.user?.role]);

  if (loading)
    return (
      <div className="text-center mt-10">
        <Loading />
      </div>
    );
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;

  // Get current users for pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  // Pagination Handler
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">
        Admin Analytics Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Card
          icon={<FaDollarSign />}
          title="Total Sales"
          value={`৳ ${totalSales}`}
          color="text-blue-600"
        />
        <Card
          icon={<FaBox />}
          title="Total Orders"
          value={totalOrders.toString()}
          color="text-green-600"
        />
        <Card
          icon={<FaChartLine />}
          title="Products Sold"
          value={totalProductsSold.toString()}
          color="text-yellow-600"
        />
        <Card
          icon={<FaUsers />}
          title="Total Users"
          value={totalUsers.toString()}
          color="text-red-600"
        />
        <Card
          icon={<FaUsers />}
          title="Total Resellers"
          value={totalResellers.toString()}
          color="text-teal-600"
        />
      </div>

      {/* Sales Chart */}
      <div className="mt-10 bg-white p-6 rounded-xl shadow-md border">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          📈 Sales by Seller
        </h2>
        <Bar data={chartData} />
      </div>

      {/* Reseller Users Table */}
      <div className="mt-10 bg-white p-6 rounded-xl shadow-md border">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          👤 Reseller Information
        </h2>
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Address</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers
                .filter((user) => user.role === "reseller") // Only show resellers
                .map((user, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.phone}</td>
                    <td className="px-4 py-2">{user.address}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md mr-2"
          >
            Previous
          </button>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={indexOfLastUser >= users.length}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
          >
            Next
          </button>
        </div>
      </div>
      <div className="mt-10 bg-white p-6 rounded-xl shadow-md border">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          👤 Users Information
        </h2>
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Address</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers
                .filter((user) => user.role === "user") // Only show resellers
                .map((user, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.phone}</td>
                    <td className="px-4 py-2">{user.address}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md mr-2"
          >
            Previous
          </button>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={indexOfLastUser >= users.length}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
          >
            Next
          </button>
        </div>
      </div>

      {/* Seller Product Status */}
      <div className="mt-10 bg-white p-6 rounded-xl shadow-md border">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          📦 Product Status by Seller
        </h2>
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Seller</th>
                <th className="px-4 py-2">Products Sold</th>
                <th className="px-4 py-2">Delivered</th>
                <th className="px-4 py-2">Processing</th>
                <th className="px-4 py-2">Shipped</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(sellerSalesMap).map((sellerEmail, index) => {
                const soldProducts = sellerSalesMap[sellerEmail];
                const { delivered, Processing, Shipped } =
                  sellerStatusMap[sellerEmail];

                return (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{sellerEmail}</td>
                    <td className="px-4 py-2">{soldProducts}</td>
                    <td className="px-4 py-2">{delivered}</td>
                    <td className="px-4 py-2">{Processing}</td>
                    <td className="px-4 py-2">{Shipped}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Card = ({
  icon,
  title,
  value,
  color,
}: {
  icon: JSX.Element;
  title: string;
  value: string;
  color: string;
}) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition duration-300">
    <div className="flex items-center mb-3 text-xl font-semibold text-gray-700 gap-3">
      <span className={`text-2xl ${color}`}>{icon}</span>
      <h2>{title}</h2>
    </div>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </div>
);

export default function ProtectedPage() {
  return (
    <WithAuth requiredRoles={["admin"]}>
      <AdminAnalytics />
    </WithAuth>
  );
}
