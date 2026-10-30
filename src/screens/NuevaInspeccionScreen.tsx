import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Inspeccion } from '../types';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { colors } from '../theme/colors';

interface Props {
  navigation: any;
  route?: any;
}

export const NuevaInspeccionScreen: React.FC<Props> = ({ navigation, route }) => {
  const editId = route?.params?.editId;

  const [tipo, setTipo] = useState<'inspeccion_seguro' | 'pre_inspeccion'>('inspeccion_seguro');
  const [banco, setBanco] = useState('Banco de Chile');
  const [siniestro, setSiniestro] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [rut, setRut] = useState('');
  const [direccion, setDireccion] = useState('');
  const [correo, setCorreo] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [isEditing, setIsEditing] = useState(false);

  const bancos = [
    'Banco de Chile',
    'Santander',
    'BCI',
    'BancoEstado',
    'Scotiabank',
    'Itaú',
    'Consorcio'
  ];

  useEffect(() => {
    if (editId) {
      setIsEditing(true);
      storageService.getInspeccionById(editId).then(existing => {
        if (existing) {
          setTipo(existing.tipo);
          setBanco(existing.banco);
          setSiniestro(existing.siniestro);
          setNombreCliente(existing.nombreCliente);
          setRut(existing.rut || '');
          setDireccion(existing.direccion || '');
          setCorreo(existing.correo || '');
          setFecha(existing.fecha);
        }
      });
    } else {
      // Generar siniestro sugerido
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      setSiniestro(`SIN-2026-${randomNum}`);
    }
  }, [editId]);

  const handleGenerateSiniestro = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    setSiniestro(`SIN-2026-${randomNum}`);
  };

  const handleSave = async () => {
    if (!nombreCliente.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingrese el nombre del asegurado o cliente.');
      return;
    }
    if (!siniestro.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingrese el número de siniestro.');
      return;
    }
    if (!direccion.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingrese la dirección del inmueble.');
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();

      if (isEditing && editId) {
        const existing = await storageService.getInspeccionById(editId);
        if (existing) {
          const updated: Inspeccion = {
            ...existing,
            tipo,
            banco,
            siniestro,
            nombreCliente: nombreCliente.trim(),
            rut: rut.trim(),
            direccion: direccion.trim(),
            correo: correo.trim(),
            fecha
          };
          await storageService.saveInspeccion(updated);
          if (Platform.OS === 'web') {
            if (typeof window !== 'undefined') window.alert('Inspección actualizada correctamente.');
          } else {
            Alert.alert('Éxito', 'Inspección actualizada correctamente.');
          }
          navigation.goBack();
          return;
        }
      }

      const nextFolio = await storageService.getNextFolio();
      const newInspeccion: Inspeccion = {
        id: `insp-${Date.now()}`,
        folioNumber: nextFolio,
        tipo,
        banco,
        siniestro: siniestro.trim(),
        nombreCliente: nombreCliente.trim(),
        rut: rut.trim(),
        direccion: direccion.trim(),
        correo: correo.trim(),
        fecha,
        estado: 'borrador',
        inspectorId: currentUser?.id || 'usr-insp-1',
        inspectorNombre: currentUser?.nombre || 'Inspector Terreno',
        dependencias: [],
        metrosCuadradosTotales: 0
      };

      await storageService.saveInspeccion(newInspeccion);
      if (Platform.OS === 'web') {
        navigation.replace('GestionDependencias', { id: newInspeccion.id });
      } else {
        Alert.alert(
          'Inspección Creada',
          `Se ha generado el folio #${nextFolio.toString().padStart(3, '0')}. Ahora puedes registrar las dependencias y daños.`,
          [
            {
              text: 'Ir a Dependencias',
              onPress: () =>
                navigation.replace('GestionDependencias', { id: newInspeccion.id })
            },
            {
              text: 'Ver en Lista',
              onPress: () => navigation.navigate('Inspecciones')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error al guardar inspección:', error);
      Alert.alert('Error', 'No se pudo guardar la inspección.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Cabecera */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing ? 'Editar Ficha de Inspección' : 'Nueva Inspección de Siniestro'}
          </Text>
          <Text style={styles.subtitle}>
            Registre los antecedentes preliminares del asegurado y la entidad bancaria.
          </Text>
        </View>

        {/* Tipo de Inspección */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Tipo de Inspección</Text>
          <View style={styles.tipoRow}>
            <TouchableOpacity
              style={[
                styles.tipoChip,
                tipo === 'inspeccion_seguro' && styles.tipoChipActive
              ]}
              onPress={() => setTipo('inspeccion_seguro')}
            >
              <Ionicons
                name="shield-outline"
                size={16}
                color={tipo === 'inspeccion_seguro' ? '#ffffff' : colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tipoChipText,
                  tipo === 'inspeccion_seguro' && styles.tipoChipTextActive
                ]}
              >
                Siniestro con Póliza
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tipoChip,
                tipo === 'pre_inspeccion' && styles.tipoChipActive
              ]}
              onPress={() => setTipo('pre_inspeccion')}
            >
              <Ionicons
                name="clipboard-outline"
                size={16}
                color={tipo === 'pre_inspeccion' ? '#ffffff' : colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tipoChipText,
                  tipo === 'pre_inspeccion' && styles.tipoChipTextActive
                ]}
              >
                Pre-Inspección
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Entidad Bancaria */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Entidad Bancaria / Mandante</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankScroll}>
            {bancos.map(b => (
              <TouchableOpacity
                key={b}
                style={[styles.bankChip, banco === b && styles.bankChipActive]}
                onPress={() => setBanco(b)}
              >
                <Text style={[styles.bankChipText, banco === b && styles.bankChipTextActive]}>
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Número de Siniestro */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>N° de Siniestro / Referencia</Text>
            <TouchableOpacity onPress={handleGenerateSiniestro}>
              <Text style={styles.generateLink}>Generar aleatorio</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            value={siniestro}
            onChangeText={setSiniestro}
            placeholder="ej: SIN-2026-88412"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Nombre Cliente */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nombre Completo del Asegurado / Contacto *</Text>
          <TextInput
            style={styles.input}
            value={nombreCliente}
            onChangeText={setNombreCliente}
            placeholder="ej: Carlos Henríquez Morales"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* RUT y Fecha en fila */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>RUT Asegurado</Text>
            <TextInput
              style={styles.input}
              value={rut}
              onChangeText={setRut}
              placeholder="12.345.678-K"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Fecha Inspección</Text>
            <TextInput
              style={styles.input}
              value={fecha}
              onChangeText={setFecha}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {/* Dirección */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Dirección del Inmueble *</Text>
          <TextInput
            style={styles.input}
            value={direccion}
            onChangeText={setDireccion}
            placeholder="ej: Av. Las Condes 12450, Depto 402, Santiago"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Correo Electrónico */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Correo Electrónico para Copia de Informe</Text>
          <TextInput
            style={styles.input}
            value={correo}
            onChangeText={setCorreo}
            placeholder="cliente@correo.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Ionicons name="checkmark-done" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.saveBtnText}>
            {isEditing ? 'Guardar Cambios' : 'Guardar y Continuar a Dependencias'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  scroll: {
    padding: 18,
    paddingBottom: 40
  },
  header: {
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18
  },
  fieldGroup: {
    marginBottom: 16
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6
  },
  generateLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary
  },
  tipoRow: {
    flexDirection: 'row'
  },
  tipoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    marginRight: 6
  },
  tipoChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark
  },
  tipoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  tipoChipTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  bankScroll: {
    flexDirection: 'row'
  },
  bankChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8
  },
  bankChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  bankChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  bankChipTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  row: {
    flexDirection: 'row'
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  }
});
