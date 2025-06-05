import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function PendingPaymentsScreen() {
  const [activeTab, setActiveTab] = useState('Ongoing');

  const handleBackPress = () => {
    router.back();
  };

  const handleEditPress = (paymentId: string) => {
    // Handle edit action
    console.log('Edit payment:', paymentId);
  };

  // Sample payment data
  const paymentData = [
    // Ongoing payments
    {
      id: '1',
      name: 'Kedarkantha',
      amount: '$4237',
      date: '24 April 2024',
      status: 'Ongoing'
    },
    {
      id: '2',
      name: 'Kedarkantha',
      amount: '$4237',
      date: '24 April 2024',
      status: 'Ongoing'
    },
    {
      id: '3',
      name: 'Kedarkantha',
      amount: '$4237',
      date: '24 April 2024',
      status: 'Ongoing'
    },
    {
      id: '4',
      name: 'Kedarkantha',
      amount: '$4237',
      date: '24 April 2024',
      status: 'Ongoing'
    },
    {
      id: '5',
      name: 'Rajesh Kumar',
      amount: '$3850',
      date: '22 April 2024',
      status: 'Ongoing'
    },
    {
      id: '6',
      name: 'Priya Sharma',
      amount: '$5200',
      date: '20 April 2024',
      status: 'Ongoing'
    },
    {
      id: '7',
      name: 'Amit Singh',
      amount: '$2900',
      date: '18 April 2024',
      status: 'Ongoing'
    },
    {
      id: '8',
      name: 'Neha Patel',
      amount: '$4100',
      date: '16 April 2024',
      status: 'Ongoing'
    },
    {
      id: '9',
      name: 'Vikram Joshi',
      amount: '$3750',
      date: '14 April 2024',
      status: 'Ongoing'
    },
    {
      id: '10',
      name: 'Sunita Rao',
      amount: '$4500',
      date: '12 April 2024',
      status: 'Ongoing'
    },

    // Pending payments
    {
      id: '11',
      name: 'Kedarkantha',
      amount: '$4237',
      date: '24 April 2024',
      status: 'Pending'
    },
    {
      id: '12',
      name: 'Arjun Mehta',
      amount: '$3200',
      date: '23 April 2024',
      status: 'Pending'
    },
    {
      id: '13',
      name: 'Kavya Reddy',
      amount: '$2800',
      date: '21 April 2024',
      status: 'Pending'
    },
    {
      id: '14',
      name: 'Rohit Gupta',
      amount: '$3900',
      date: '19 April 2024',
      status: 'Pending'
    },
    {
      id: '15',
      name: 'Deepika Nair',
      amount: '$4600',
      date: '17 April 2024',
      status: 'Pending'
    },
    {
      id: '16',
      name: 'Manish Agarwal',
      amount: '$3300',
      date: '15 April 2024',
      status: 'Pending'
    },
    {
      id: '17',
      name: 'Pooja Verma',
      amount: '$2700',
      date: '13 April 2024',
      status: 'Pending'
    },
    {
      id: '18',
      name: 'Sanjay Iyer',
      amount: '$4800',
      date: '11 April 2024',
      status: 'Pending'
    },

    // Completed payments
    {
      id: '19',
      name: 'Kedarkantha',
      amount: '$4237',
      date: '24 April 2024',
      status: 'Completed'
    },
    {
      id: '20',
      name: 'Ravi Krishnan',
      amount: '$3500',
      date: '10 April 2024',
      status: 'Completed'
    },
    {
      id: '21',
      name: 'Anita Desai',
      amount: '$4200',
      date: '08 April 2024',
      status: 'Completed'
    },
    {
      id: '22',
      name: 'Suresh Pillai',
      amount: '$3800',
      date: '06 April 2024',
      status: 'Completed'
    },
    {
      id: '23',
      name: 'Meera Jain',
      amount: '$2950',
      date: '04 April 2024',
      status: 'Completed'
    },
    {
      id: '24',
      name: 'Kiran Bhat',
      amount: '$4400',
      date: '02 April 2024',
      status: 'Completed'
    },
    {
      id: '25',
      name: 'Rahul Saxena',
      amount: '$3650',
      date: '31 March 2024',
      status: 'Completed'
    },
    {
      id: '26',
      name: 'Shreya Kapoor',
      amount: '$5100',
      date: '29 March 2024',
      status: 'Completed'
    },
    {
      id: '27',
      name: 'Arun Malhotra',
      amount: '$2600',
      date: '27 March 2024',
      status: 'Completed'
    },
    {
      id: '28',
      name: 'Divya Sinha',
      amount: '$4000',
      date: '25 March 2024',
      status: 'Completed'
    },
  ];

  const filteredPayments = paymentData.filter(payment => payment.status === activeTab);

  const renderPaymentItem = (payment: any) => (
    <View key={payment.id} style={styles.paymentCard}>
      <View style={styles.paymentAvatar}>
        <Text style={styles.paymentAvatarText}>{payment.name.charAt(0)}</Text>
      </View>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentName}>{payment.name}</Text>
        <Text style={styles.paymentAmount}>{payment.amount}</Text>
        <Text style={styles.paymentDate}>{payment.date}</Text>
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => handleEditPress(payment.id)}
      >
        <MaterialIcons name="edit" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Payments</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabsContainer}>
        {['Ongoing', 'Pending', 'Completed'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payment List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredPayments.map(renderPaymentItem)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for better scrolling experience
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  paymentAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc3545',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: '#999',
  },
  editButton: {
    padding: 8,
  },
});
