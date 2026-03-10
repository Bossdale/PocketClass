import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Globe, GraduationCap, ArrowRight } from 'lucide-react-native';
import { saveProfile, initializeSubjectProgress, generateId } from '../lib/store';
import { getCurriculumName, type Country } from '../lib/types';

const COUNTRIES: { id: Country; name: string; flag: string }[] = [
  { id: 'indonesia', name: 'Indonesia', flag: '🇮🇩' },
  { id: 'malaysia', name: 'Malaysia', flag: '🇲🇾' },
  { id: 'brunei', name: 'Brunei', flag: '🇧🇳' },
];

export default function Onboarding() {
  const router = useRouter(); // Expo Router instead of useNavigate
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [country, setCountry] = useState<Country | null>(null);
  const [grade, setGrade] = useState<number | null>(null);

  const canContinue = step === 0 ? name.trim().length > 0 : step === 1 ? country !== null : grade !== null;

  const handleContinue = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else if (name && country && grade) {
      // Because we changed store.ts, these must be awaited!
      await saveProfile({
        id: generateId(),
        name: name.trim(),
        country,
        grade,
        createdAt: new Date().toISOString(),
      });
      await initializeSubjectProgress();
      
      // Navigate to tabs using Expo Router
      router.replace('/(tabs)'); 
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 px-6 py-12 max-w-md w-full self-center justify-center">
        
        {/* Logo */}
        <View className="items-center mb-8">
          <View className="flex-row items-center gap-3 mb-2">
            <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center">
              <GraduationCap size={24} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-bold text-foreground">PocketClass</Text>
          </View>
          <Text className="text-sm text-gray-500">Your AI tutor, always with you</Text>
        </View>

        {/* Step Card */}
        <View className="bg-secondary/20 p-6 rounded-3xl border border-gray-200 dark:border-gray-800">
          
          {step === 0 && (
            <View>
              <View className="flex-row items-center gap-2 mb-4">
                <User size={20} color="#3b82f6" />
                <Text className="text-lg font-semibold text-foreground">What's your name?</Text>
              </View>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
                className="w-full bg-white dark:bg-gray-900 rounded-xl px-4 py-4 text-foreground border border-gray-200 dark:border-gray-800"
                onSubmitEditing={() => canContinue && handleContinue()}
              />
            </View>
          )}

          {step === 1 && (
            <View>
              <View className="flex-row items-center gap-2 mb-4">
                <Globe size={20} color="#3b82f6" />
                <Text className="text-lg font-semibold text-foreground">Where are you from?</Text>
              </View>
              <View className="gap-2">
                {COUNTRIES.map(c => (
                  <Pressable
                    key={c.id}
                    onPress={() => setCountry(c.id)}
                    className={`w-full flex-row items-center gap-3 p-4 rounded-xl border-2 ${
                      country === c.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <Text className="text-2xl">{c.flag}</Text>
                    <View>
                      <Text className="font-medium text-foreground">{c.name}</Text>
                      <Text className="text-xs text-gray-500">{getCurriculumName(c.id)}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <View className="flex-row items-center gap-2 mb-4">
                <GraduationCap size={20} color="#3b82f6" />
                <Text className="text-lg font-semibold text-foreground">Select your grade</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {[7, 8, 9, 10, 11, 12].map(g => (
                  <Pressable
                    key={g}
                    onPress={() => setGrade(g)}
                    className={`p-4 rounded-xl border-2 w-[31%] items-center ${
                      grade === g ? 'border-blue-500 bg-blue-500/10' : 'border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <Text className={`font-medium ${grade === g ? 'text-blue-500' : 'text-foreground'}`}>
                      Grade {g}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Continue Button */}
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          className={`w-full mt-6 py-4 rounded-xl flex-row items-center justify-center gap-2 ${
            canContinue ? 'bg-blue-500' : 'bg-blue-500/50'
          }`}
        >
          <Text className="text-white font-semibold text-lg">
            {step === 2 ? 'Start Learning' : 'Continue'}
          </Text>
          {step === 2 && <ArrowRight size={20} color="white" />}
        </Pressable>

      </View>
    </View>
  );
}