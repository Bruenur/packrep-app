import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Appointment, addLeadActivity, Builder, loadLeads, makeId, nowStamp, upsertAppointment, Lead } from '../lib/storage';
import { colors, s } from '../ui/styles';

export default function AppointmentScreen({
  builder,
  onBack,
  onCreateLead,
}: {
  builder: Builder | null;
  onBack: () => void;
  onCreateLead: () => void;
}) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');

  useEffect(() => {
    loadLeads().then(setLeads);
  }, []);

  const selectedLead = useMemo(() => leads.find((x) => x.id === selectedLeadId) || null, [leads, selectedLeadId]);

  async function saveAppointment() {
    if (!builder) return;
    if (!date.trim() || !time.trim()) {
      Alert.alert('Missing', 'Date and time are required.');
      return;
    }
    const appt: Appointment = {
      id: makeId('APPT'),
      at: nowStamp(),
      date: date.trim(),
      time: time.trim(),
      builderId: builder.id,
      builderName: builder.name,
      communityName: builder.communityName,
      leadId: selectedLead?.id,
      leadName: selectedLead?.buyerName,
      notes: notes.trim() || undefined,
    };
    await upsertAppointment(appt);
    if (selectedLead) {
      await addLeadActivity(selectedLead.id, {
        type: 'note',
        label: `Appointment scheduled with ${builder.name} • ${builder.communityName} • ${date.trim()} ${time.trim()}`,
      });
    }
    Alert.alert('Saved', 'Appointment saved.');
    onBack();
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.card}>
        <Text style={s.h1}>Schedule Appointment</Text>
        <Text style={s.small}>Set a time with the builder or online sales rep, then tie it to an existing PackRep customer if they are already in the system.</Text>
      </View>

      <View style={s.card}>
        <Text style={s.h2}>{builder?.name || 'Builder'}</Text>
        <Text style={s.listSub}>{builder?.communityName || 'Community'}</Text>
        <Text style={s.listSub}>{builder?.address || ''}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.label}>Appointment Date</Text>
        <TextInput style={s.input} value={date} onChangeText={setDate} placeholder='2026-04-25' placeholderTextColor='#7b92ae' />
        <Text style={s.label}>Appointment Time</Text>
        <TextInput style={s.input} value={time} onChangeText={setTime} placeholder='2:00 PM' placeholderTextColor='#7b92ae' />
        <Text style={s.label}>Notes</Text>
        <TextInput style={[s.input, { minHeight: 88, textAlignVertical: 'top' }]} multiline value={notes} onChangeText={setNotes} placeholder='What they are touring, timing, lot, urgency, or questions for the OSC.' placeholderTextColor='#7b92ae' />
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Pick the Customer</Text>
        <Text style={s.small}>If the customer is not in PackRep yet, create them first, then come back and schedule the appointment.</Text>

        {leads.length ? leads.map((lead) => {
          const active = selectedLeadId === lead.id;
          return (
            <Pressable key={lead.id} style={[s.listItem, { marginTop: 10, borderColor: active ? colors.accent : colors.border }]} onPress={() => setSelectedLeadId(active ? '' : lead.id)}>
              <Text style={s.listTitle}>{lead.buyerName}</Text>
              <Text style={s.listSub}>{lead.city || 'Area'}{lead.zip ? ` • ${lead.zip}` : ''}{lead.priceMax ? ` • Max $${Number(String(lead.priceMax).replace(/[^\d]/g, '') || 0).toLocaleString()}` : ''}</Text>
            </Pressable>
          );
        }) : <Text style={[s.small, { marginTop: 10 }]}>No customers saved yet.</Text>}

        <View style={{ gap: 10, marginTop: 14 }}>
          <Pressable style={s.btnGhost} onPress={onCreateLead}>
            <Text style={s.btnGhostText}>Create New Lead First</Text>
          </Pressable>
          <Pressable style={s.btn} onPress={saveAppointment}>
            <Text style={s.btnText}>Save Appointment</Text>
          </Pressable>
          <Pressable style={s.btnGhost} onPress={onBack}>
            <Text style={s.btnGhostText}>Back</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
