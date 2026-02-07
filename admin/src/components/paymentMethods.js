import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Modal,
  message,
  Statistic,
  Row,
  Col
} from 'antd';
import {
  BankOutlined,
  MobileOutlined,
  MoneyCollectOutlined,
  CheckCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import api from '../services/api';

const PAYMENT_METHODS_CONFIG = {
  cash: { name: 'Cash on Delivery', icon: <MoneyCollectOutlined />, color: 'green' },
  cbe: { name: 'CBE', icon: <BankOutlined />, color: 'blue' },
  telebirr: { name: 'Telebirr', icon: <MobileOutlined />, color: 'orange' },
  mpesa: { name: 'M-Pesa', icon: <MobileOutlined />, color: 'purple' },
  abisnya: { name: 'Abisnya', icon: <BankOutlined />, color: 'default' },
  enat: { name: 'Enat Bank', icon: <BankOutlined />, color: 'pink' },
  dashen: { name: 'Dashen Bank', icon: <BankOutlined />, color: 'gray' },
  other: { name: 'Other', icon: <BankOutlined />, color: 'default' }
};

export default function PaymentMethods() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/admin/payments');
      setPayments(response.data.payments);
    } catch (error) {
      message.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/payments/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const handleVerify = async (payment) => {
    setSelectedPayment(payment);
    setVerifying(true);
    try {
      await api.post(`/admin/payments/${payment._id}/verify`);
      message.success('Payment verified successfully');
      fetchPayments();
      fetchStats();
      setModalVisible(false);
    } catch (error) {
      message.error('Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId'
    },
    {
      title: 'Customer',
      dataIndex: 'user',
      key: 'user',
      render: (user) => user?.fullName || 'N/A'
    },
    {
      title: 'Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method) => {
        const config = PAYMENT_METHODS_CONFIG[method] || {};
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.name}
          </Tag>
        );
      }
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `${amount} Birr`
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        const statusConfig = {
          pending: { color: 'orange', text: 'Pending' },
          paid: { color: 'green', text: 'Paid' },
          failed: { color: 'red', text: 'Failed' },
          refunded: { color: 'gray', text: 'Refunded' }
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedPayment(record);
            setModalVisible(true);
          }}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Payments"
              value={stats.totalPayments || 0}
              prefix={<MoneyCollectOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending || 0}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Verified"
              value={stats.verified || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={stats.totalAmount || 0}
              prefix="Birr"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Payment Transactions">
        <Table
          columns={columns}
          dataSource={payments}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Payment Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          selectedPayment?.paymentStatus === 'pending' && (
            <Button
              key="verify"
              type="primary"
              loading={verifying}
              onClick={() => handleVerify(selectedPayment)}
            >
              Verify Payment
            </Button>
          ),
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {selectedPayment && (
          <div>
            <p><strong>Order ID:</strong> {selectedPayment.orderId}</p>
            <p><strong>Customer:</strong> {selectedPayment.user?.fullName}</p>
            <p><strong>Phone:</strong> {selectedPayment.user?.phone}</p>
            <p><strong>Payment Method:</strong> {PAYMENT_METHODS_CONFIG[selectedPayment.paymentMethod]?.name}</p>
            <p><strong>Amount:</strong> {selectedPayment.totalAmount} Birr</p>
            <p><strong>Status:</strong> {selectedPayment.paymentStatus}</p>
            <p><strong>Transaction ID:</strong> {selectedPayment.paymentDetails?.transactionId || 'N/A'}</p>
            <p><strong>Account:</strong> {selectedPayment.paymentDetails?.accountNumber || 'N/A'}</p>
            <p><strong>Date:</strong> {new Date(selectedPayment.createdAt).toLocaleString()}</p>
            {selectedPayment.paymentDetails?.receiptUrl && (
              <p>
                <strong>Receipt:</strong>{' '}
                <a href={selectedPayment.paymentDetails.receiptUrl} target="_blank" rel="noopener noreferrer">
                  View Receipt
                </a>
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
