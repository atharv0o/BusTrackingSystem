import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GradientShell from '../components/GradientShell';

function ChoiceButton({ title, subtitle, icon, color, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.choice, { backgroundColor: color }]}>
      <View style={styles.choiceHeader}>
        <MaterialCommunityIcons name={icon} size={24} color="#FFFFFF" />
        <Text style={styles.choiceTitle}>{title}</Text>
      </View>
      <Text style={styles.choiceSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function LaunchScreen({ navigation }) {
  return (
    <GradientShell>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Smart Bus Tracking</Text>
          <Text style={styles.title}>Local-first tracking that actually works.</Text>
          <Text style={styles.subtitle}>
            Sign in locally, create trips, share a tracking code, and follow the bus live with smooth GPS updates.
          </Text>
        </View>

        <View style={styles.options}>
          <ChoiceButton
            title="Driver"
            subtitle="Create trip, track GPS, manage stops"
            icon="bus"
            color="#111827"
            onPress={() => navigation.navigate('Auth', { role: 'driver' })}
          />
          <ChoiceButton
            title="Student"
            subtitle="Enter tracking code and follow the bus"
            icon="map-marker-path"
            color="#2563EB"
            onPress={() => navigation.navigate('Auth', { role: 'student' })}
          />
        </View>
      </View>
    </GradientShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  hero: {
    marginBottom: 30
  },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '800',
    marginBottom: 10
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    color: '#0F172A',
    fontWeight: '900'
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#475569'
  },
  options: {
    gap: 14
  },
  choice: {
    borderRadius: 24,
    padding: 20,
    minHeight: 116,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2
  },
  choiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  choiceTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900'
  },
  choiceSubtitle: {
    color: 'rgba(255,255,255,0.86)',
    marginTop: 6
  }
});
