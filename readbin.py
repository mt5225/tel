import binascii

def get_fire_msg_array(data):
    msg_array =  [x for x in data.split('02') if ('4e47' in x or '4e67' in x)]
    return msg_array


for item in ['Test_2_0910_setup.bin', 'Test_2 0910_3F-3.bin', 'Test_2 0910_3F-4.bin', 'Test_2 0910_3F-6.bin']:
    with open("./data/" + item, "rb") as binary_file:
        # Read the whole file at once
        data = binary_file.read()
        text_string = binascii.hexlify(data)
        print("=====" + item + "======\n")
        print("\n".join(map(str, get_fire_msg_array(text_string))))