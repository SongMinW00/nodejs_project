import axios from 'axios';
import React, { Component, createRef }  from 'react';
import {Keyboard, TouchableWithoutFeedback, TextInput, StyleSheet,
  View, Text, Alert, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { StatusBar } from 'react-native';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: '',
      text: '',
      inputText: '',
      title1: '로그인',
      title2 : '인증 완료',
      title3 : '지우기',
      keyboardH: 0,  //대충 키보드height라는 뜻
    }
  }
  _submitBtn = async () => {
    const res = await axios.post('http://10.0.2.2:8080/api',{ //10.0.2.2는 애뮬레이터의 로컬호스트
      _id: '1'
    })
    // 응답(성공)
    .then(res => {
      console.log(res.data[0].otp);
      this.setState({text: res.data[0].otp}); //res로 받은 data의 0번째 열 pw값
    })
    // 응답(실패)
    .catch((error)=> {
      if (error.response) {
        // 요청이 만들어졌고, 실패 상태코드와 함께 서버가 응답함
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // 요청은 만들어졌지만, 서버로부터 응답받지 못함
         console.log(error.request);
      } else {
        // 요청이 만들어지는 과정에서 오류가 발생함
        console.log('Error', error.message);
      }
  })
    // 응답(항상 실행)
    .then(function () {
      // ...
    });
  }
  _alertmes = () => {
    Alert.alert(                                     // 말그대로 Alert를 띄운다
        '인증 완료',                                  // 첫번째 text: 타이틀 제목
        '인증을 수행하였습니다.',                      // 설명
        [                                            // 버튼 배열
          {
            text: "확인",                             // 버튼 제목
            style: "cancel"
          }
        ],
        { cancelable: false }
      );
  }
  _connect = async () => {
    this.setState({inputText: ''});
    this.setState({text: ''});
    const res = await axios.get('http://10.0.2.2:8080/insert');
}
  _delete = () => {
    this.setState({text: null});
  }

  render() {  
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container} >
          <View style={styles.empty}>
          </View>
            <View  style={styles.bodyContainer}>
             <Text style={styles.headerText}>Login</Text>
             <TextInput
                style={styles.textInput}
                onChangeText={(text) => {this.setState({inputText: text})}}
                placeholderTextColor ='white'
                placeholder="아이디"
                />
              <Text style = {styles.showText}>{this.state.text}</Text>

              <TouchableOpacity style={styles.Btn} onPress = {this._submitBtn} >
              <Text style={{fontSize: 20, color: 'white'}}>{this.state.title1}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.Btn}
                onPress = { () => {
                this._connect()
                this._alertmes()
                }}>
              <Text style={{fontSize: 20, color: 'white'}}>{this.state.title2}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.Btn} onPress = {this._delete}>
              <Text style={{fontSize: 20, color: 'white'}}>{this.state.title3}</Text>
              </TouchableOpacity>

            </View>
        </View>
        </TouchableWithoutFeedback>
    )
  }
}

StatusBar.setBackgroundColor("white"); //상태바의 바탕색 설정
StatusBar.setBarStyle('dark-content'); //상태바의 글씨색 설정

const styles = StyleSheet.create({
    container: {
      backgroundColor: '#6c757d',
      paddingHorizontal: 40,
      flex: 1,
      
    },
    empty: {
      flex:2/10
    },
    headerText: {
      paddingTop: 0,
      alignItems: 'center',
      fontSize: 45,
      marginVertical: 30,
      color: 'black',
      alignItems: "center",
      fontWeight: 'bold'
    },
    textInput: {
      marginTop: 0,
      marginBottom: 0,
      paddingHorizontal: 10,
      height: 40,
      borderRadius: 5,
      borderColor: '#6c757d',
      borderWidth: 1,
      color: 'black'
    },
    bodyContainer: {
      backgroundColor: 'white',
      paddingHorizontal: 30,
      marginVertical: 50,
      flex: 5/6,
      borderRadius:30,
    },
    showText: {
        marginTop: 5,
        marginBottom: 10,
        paddingHorizontal: 10,
        height: 40,
        borderRadius: 5,
        borderColor: '#6c757d',
        borderWidth: 1,
        color: 'black',
    },
    Btn: {
        marginTop: 5,
        marginBottom: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        alignItems: 'center',
        backgroundColor: '#6c757d',
        }
  })