import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Block, Button, Input, Text } from "../../components/ui";
import useTheme from "../../hooks/useTheme";

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const { colors, sizes } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Nhập email và mật khẩu");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải >= 6 ký tự");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password);
    } catch (e) {
      setError(e?.message || "Lỗi đăng ký");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Block safe gradient={colors.gradients?.secondary}>
      <Block scroll paddingHorizontal={sizes.padding}>
        <Block flex={0} paddingVertical={sizes.xl} marginTop={sizes.l}>
          <Text h1 center bold marginBottom={sizes.s} gradient={colors.gradients?.primary}>
            Tạo tài khoản
          </Text>
          <Text h4 center gray marginBottom={sizes.md}>
            Bắt đầu hành trình của bạn
          </Text>
        </Block>

        <Block card flex={0} padding={sizes.padding} marginBottom={sizes.m}>
          <Input
            label="Email"
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            marginBottom={sizes.sm}
            primary
          />
          <Input
            label="Mật khẩu"
            placeholder="Tối thiểu 6 ký tự"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            marginBottom={sizes.sm}
            primary
          />
          <Input
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            marginBottom={sizes.sm}
            primary
          />

          {!!error && (
            <Block
              flex={0}
              padding={sizes.s}
              radius={sizes.inputRadius}
              color="rgba(231, 76, 60, 0.1)"
              marginBottom={sizes.sm}>
              <Text danger center>
                {error}
              </Text>
            </Block>
          )}

          <Button
            gradient={colors.gradients?.primary}
            shadow
            disabled={loading}
            onPress={handleRegister}
            marginVertical={sizes.sm}
            radius={sizes.buttonRadius}
            style={{
              paddingVertical: 8,     // nhỏ gọn hơn
              paddingHorizontal: 18,
              alignItems: 'center',
              alignSelf: 'center',
              minWidth: 150,
              borderWidth: 1.2,
              borderColor: '#2E7DD7', // viền xanh nhẹ để nổi
              opacity: loading ? 0.85 : 1,
            }}
          >
            <Text black bold style={{ fontSize: 14 }}>
              {loading ? "Đang đăng ký..." : "Tạo tài khoản"}
            </Text>
          </Button>


          <Button
            flex={0}
            onPress={() => navigation.navigate("Login")}
            marginTop={sizes.s}>
            <Text center primary semibold>
              Đã có tài khoản? <Text bold primary>Đăng nhập</Text>
            </Text>
          </Button>
        </Block>
      </Block>
    </Block>
  );
}
