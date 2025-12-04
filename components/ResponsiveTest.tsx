// ============================================================================
// RESPONSIVE DESIGN VALIDATION TEST - RUNTIME SCALING
// ============================================================================
/**
 * Tests RUNTIME responsive scaling that updates on rotation/font changes
 * 
 * TESTING INSTRUCTIONS:
 * 1. View in portrait - note "Runtime" padding value
 * 2. ROTATE TO LANDSCAPE - watch "Runtime" padding INCREASE, "Fixed" stays same
 * 3. Change Settings → Display → Font Size → Largest
 *    Return to app - "Runtime" text gets larger with fontScale multiplication
 * 
 * Remove this file after validation
 */

import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ResponsiveTest(): React.JSX.Element {
  const { 
    width, 
    height, 
    isTablet, 
    isSmallPhone, 
    isLandscape,
    isHighDPI,
    fontScale,
    getMargin,
    s,   // Runtime horizontal scale
    vs,  // Runtime vertical scale
    ms   // Runtime moderate scale
  } = useResponsive();
  const theme = useTheme();

  // Log to console to verify dimensions update
  React.useEffect(() => {
    console.log('📐 DIMENSIONS CHANGED:', { width, height, isLandscape });
  }, [width, height, isLandscape]);

  // Force re-render counter to verify component updates
  const [renderCount, setRenderCount] = React.useState(0);
  React.useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, [width, height]);

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: isLandscape ? '#ffebcd' : theme.colors.surface.card,  // Tan in landscape
        padding: ms(16),
        marginVertical: vs(12),
        marginHorizontal: s(16),
        borderRadius: s(12)
      }
    ]}>
      {/* BIG OBVIOUS INDICATOR */}
      <View style={{
        backgroundColor: isLandscape ? '#ff6b6b' : '#51cf66',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        alignItems: 'center'
      }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>
          {isLandscape ? '🔄 LANDSCAPE MODE' : '📱 PORTRAIT MODE'}
        </Text>
        <Text style={{ fontSize: 18, color: '#fff', marginTop: 8 }}>
          {width} × {height}
        </Text>
        <Text style={{ fontSize: 14, color: '#fff', marginTop: 4 }}>
          Render #{renderCount} | w&gt;h: {width > height ? 'YES' : 'NO'}
        </Text>
      </View>
      <Text style={[
        styles.header, 
        { 
          color: theme.colors.text.base,
          fontSize: ms(20, 0.2),
          marginBottom: vs(12)
        }
      ]}>
        📱 Runtime Responsive Test
      </Text>
      
      {/* Device Info */}
      <View style={{ marginBottom: vs(16), gap: vs(6) }}>
        <Text style={[styles.label, { color: theme.colors.text.muted, fontSize: ms(14, 0.1) }]}>
          Dimensions: {width}×{height}px
        </Text>
        <Text style={[styles.label, { color: theme.colors.text.muted, fontSize: ms(14, 0.1) }]}>
          Device: {isTablet ? '📱 Tablet' : isSmallPhone ? '📱 Small Phone' : '📱 Phone'}
        </Text>
        <Text style={[styles.label, { color: theme.colors.text.muted, fontSize: ms(14, 0.1) }]}>
          Orientation: {isLandscape ? '🔄 Landscape' : '📱 Portrait'}
        </Text>
        <Text style={[styles.label, { color: theme.colors.text.muted, fontSize: ms(14, 0.1) }]}>
          DPI: {isHighDPI ? '🔍 High (3x+)' : '👁️ Normal'}
        </Text>
        <Text style={[styles.label, { color: theme.colors.text.muted, fontSize: ms(14, 0.1) }]}>
          Font Scale: {fontScale.toFixed(2)}x
        </Text>
        <Text style={[styles.label, { color: theme.colors.text.muted, fontSize: ms(14, 0.1) }]}>
          Auto Margin: {getMargin()}px
        </Text>
        <Text style={[styles.label, { color: theme.colors.accent.blue, fontSize: ms(14, 0.1), fontWeight: '600' }]}>
          ⚡ s(100) = {Math.round(s(100))}px | vs(100) = {Math.round(vs(100))}px
        </Text>
        <Text style={[styles.label, { color: theme.colors.accent.blue, fontSize: ms(14, 0.1), fontWeight: '600' }]}>
          ⚡ ms(50) = {Math.round(ms(50))}px
        </Text>
      </View>

      {/* DRAMATIC SIZE TEST */}
      <View style={{ marginBottom: vs(16) }}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.base, fontSize: ms(16, 0.2), marginBottom: vs(8) }]}>
          Dramatic Size Test:
        </Text>
        
        {/* Box that changes size dramatically */}
        <View style={{
          width: s(200),  // Will be ~200 in portrait, ~280+ in landscape
          height: vs(100), // Will change with height
          backgroundColor: theme.colors.accent.blueSoft,
          borderWidth: 2,
          borderColor: theme.colors.accent.blue,
          borderRadius: s(8),
          justifyContent: 'center',
          alignItems: 'center',
          padding: ms(16)
        }}>
          <Text style={{ fontSize: ms(18, 0.2), fontWeight: '700', color: theme.colors.text.base }}>
            Width: {Math.round(s(200))}px
          </Text>
          <Text style={{ fontSize: ms(14, 0.1), color: theme.colors.text.muted }}>
            Height: {Math.round(vs(100))}px
          </Text>
        </View>
      </View>

      {/* Side-by-side comparison */}
      <Text style={[
        styles.sectionTitle, 
        { 
          color: theme.colors.text.base,
          fontSize: ms(16, 0.2),
          marginBottom: vs(8),
          marginTop: vs(8)
        }
      ]}>
        Runtime Scaled vs Fixed:
      </Text>
      
      <View style={{ flexDirection: 'row', gap: s(12), marginBottom: vs(12) }}>
        {/* Runtime scaled box - RESPONSIVE */}
        <View style={[
          styles.box,
          { 
            borderColor: theme.colors.accent.green,
            padding: ms(16, 0.3),  // ← RECALCULATES on rotation!
            borderRadius: s(8)
          }
        ]}>
          <Text style={[
            styles.boxText, 
            { 
              color: theme.colors.text.base,
              fontSize: ms(16, 0.2) * fontScale  // ← Respects system font scale!
            }
          ]}>
            ✅ Runtime
          </Text>
          <Text style={[
            styles.caption, 
            { 
              color: theme.colors.text.muted,
              fontSize: ms(12, 0.1),
              marginTop: vs(4)
            }
          ]}>
            {Math.round(ms(16, 0.3))}px
          </Text>
        </View>

        {/* Fixed box - NOT RESPONSIVE */}
        <View style={[
          styles.box,
          { 
            borderColor: theme.colors.error[500],
            padding: 16,  // ← FIXED forever
            borderRadius: 8
          }
        ]}>
          <Text style={[
            styles.boxText, 
            { 
              color: theme.colors.text.base,
              fontSize: 16  // ← FIXED forever
            }
          ]}>
            ❌ Fixed
          </Text>
          <Text style={[
            styles.caption, 
            { 
              color: theme.colors.text.muted,
              fontSize: 12,
              marginTop: 4
            }
          ]}>
            16px
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <Text style={[
        styles.instructions, 
        { 
          color: theme.colors.text.subtle,
          fontSize: ms(12, 0.05),
          lineHeight: vs(16)
        }
      ]}>
        💡 ROTATE DEVICE NOW - watch "Runtime" padding change instantly!
      </Text>
    </View>
  );
}

// Minimal base styles
const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    fontWeight: '700'
  },
  label: {
    lineHeight: 20
  },
  sectionTitle: {
    fontWeight: '600'
  },
  box: {
    flex: 1,
    borderWidth: 2,
    alignItems: 'center'
  },
  boxText: {
    fontWeight: '600'
  },
  caption: {},
  instructions: {
    fontStyle: 'italic'
  }
});
