"use client";

import WithAuth from "@/app/lib/utils/withAuth";
import { useEffect, useState } from "react";
import Axios from "axios";
import {
  FaDollarSign,
  FaBox,
  FaChartLine,
  FaTrophy,
  FaTruck,
  FaShippingFast,
  FaHourglassHalf,
  FaCalendarDay,
} from "react-icons/fa";
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

const ResellerAnalytics = () => {
  const auth = useAppSelector((state: { auth: any }) => state.auth);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProductsSold, setTotalProductsSold] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [todayProductSold, setTodayProductSold] = useState(0);

  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [statusCount, setStatusCount] = useState({
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
  });

  const [filter, setFilter] = useState("monthly");
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No token found. Please log in.");
          return;
        }

        const response = await Axios.get(
          "https://mirexa-store-backend.vercel.app/api/checkout",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const allOrders = response.data.data;
        const userEmail = auth?.user?.email; // Logged-in user's email
        const today = new Date().toDateString();

        // Filter orders by reseller email matching the logged-in user
        const relevantOrders = allOrders.filter((order: any) =>
          order.items.some((item: any) => item.sellerEmail === userEmail)
        );

        const resellerItems = relevantOrders.flatMap((order: any) =>
          order.items
            .filter((item: any) => item.sellerEmail === userEmail) // Ensure the item belongs to the logged-in user
            .map((item: any) => ({
              ...item,
              createdAt: order.createdAt,
              status: order.status,
              orderId: order._id,
            }))
        );

        setOrders(relevantOrders);

        let totalAmount = 0;
        let totalItemCount = 0;
        let todaySold = 0;

        const productMap: any = {};
        const statusMap: any = { Processing: 0, Shipped: 0, Delivered: 0 };

        const dailyMap: any = {};
        const weeklyMap: any = {};
        const monthlyMap: any = {};

        resellerItems.forEach(
          (item: {
            price: number;
            quantity: number;
            createdAt: string | number | Date;
            name: string | number;
            status: string | number;
          }) => {
            const amount = item.price * item.quantity;
            totalAmount += amount;
            totalItemCount += item.quantity;

            const orderDate = new Date(item.createdAt);
            const orderDay = orderDate.toDateString();
            const month = orderDate.toLocaleString("default", {
              month: "short",
            });
            const week = new Date(
              orderDate.setDate(orderDate.getDate() - orderDate.getDay())
            ).toLocaleDateString();

            if (!productMap[item.name]) productMap[item.name] = item.quantity;
            else productMap[item.name] += item.quantity;

            if (!dailyMap[orderDay]) dailyMap[orderDay] = amount;
            else dailyMap[orderDay] += amount;

            if (!weeklyMap[week]) weeklyMap[week] = amount;
            else weeklyMap[week] += amount;

            if (!monthlyMap[month]) monthlyMap[month] = amount;
            else monthlyMap[month] += amount;

            if (orderDay === today) {
              todaySold += item.quantity;
            }

            if (statusMap[item.status] !== undefined) {
              statusMap[item.status]++;
            }
          }
        );

        const sortedProducts = Object.entries(productMap)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 5);

        setTopProducts(sortedProducts);
        setStatusCount(statusMap);
        setTotalSales(totalAmount);
        setTotalOrders(relevantOrders.length);
        setTotalProductsSold(totalItemCount);
        setAverageOrderValue(
          relevantOrders.length > 0 ? totalAmount / relevantOrders.length : 0
        );
        setTodayProductSold(todaySold);

        const selectedMap =
          filter === "daily"
            ? dailyMap
            : filter === "weekly"
            ? weeklyMap
            : monthlyMap;

        const sortedKeys = Object.keys(selectedMap).sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime()
        );

        setChartData({
          labels: sortedKeys,
          datasets: [
            {
              label:
                filter === "daily"
                  ? "Daily Sales (৳)"
                  : filter === "weekly"
                  ? "Weekly Sales (৳)"
                  : "Monthly Sales (৳)",
              data: sortedKeys.map((k) => selectedMap[k]),
              backgroundColor: "#F97316",
            },
          ],
        });

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch orders. Please try again.");
        setLoading(false);
      }
    };

    fetchOrders();
  }, [auth?.user?.email, filter]);

  if (loading)
    return (
      <div className="text-center mt-10">
        <Loading />
      </div>
    );
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">
        Reseller Analytics Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
          icon={<FaTrophy />}
          title="Products Sold"
          value={totalProductsSold.toString()}
          color="text-yellow-600"
        />
        <Card
          icon={<FaChartLine />}
          title="Avg Order Value"
          value={`৳ ${averageOrderValue.toFixed(2)}`}
          color="text-red-600"
        />
        <Card
          icon={<FaCalendarDay />}
          title="Today's Sales"
          value={`${todayProductSold} pcs`}
          color="text-emerald-600"
        />
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 text-center">
        <Card
          icon={<FaHourglassHalf />}
          title="Processing"
          value={statusCount.Processing.toString()}
          color="text-orange-500"
        />
        <Card
          icon={<FaShippingFast />}
          title="Shipped"
          value={statusCount.Shipped.toString()}
          color="text-purple-500"
        />
        <Card
          icon={<FaTruck />}
          title="Delivered"
          value={statusCount.Delivered.toString()}
          color="text-green-500"
        />
      </div>

      {/* Sales Chart */}
      <div className="mt-10 bg-white p-6 rounded-xl shadow-md border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-700">
            📈 Sales Performance ({filter})
          </h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-3 py-1 text-sm text-gray-600"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
        <Bar data={chartData} />
      </div>

      {/* Top Products */}
      <div className="mt-10 bg-white p-6 rounded-xl shadow-md border">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          💰 Top Selling Products
        </h2>
        <ul className="space-y-2">
          {topProducts.map(([name, qty], i) => (
            <li
              key={i}
              className="flex justify-between border-b py-2 text-gray-700"
            >
              <span>{name}</span>
              <span>{qty} pcs</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recent Orders */}
      <div className="mt-10 bg-white p-6 rounded-xl shadow-md border">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          📦 Recent Orders
        </h2>
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Order ID</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Total Items</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order, i) => {
                const itemCount = order.items.reduce(
                  (acc: number, item: any) =>
                    item.sellerEmail === auth.user.email
                      ? acc + item.quantity
                      : acc,
                  0
                );
                return (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">{order._id.slice(-6)}</td>
                    <td className="px-4 py-2">{order.status}</td>
                    <td className="px-4 py-2">{itemCount}</td>
                    <td className="px-4 py-2">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
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
    <WithAuth requiredRoles={["reseller"]}>
      <ResellerAnalytics />
    </WithAuth>
  );
}
